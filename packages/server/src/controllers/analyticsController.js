const Completion = require('../models/Completion');
const Habit = require('../models/Habit');
const { getWeekRange, getMonthRange, normalizeDate } = require('../utils/dateHelpers');
const { calculateStreak } = require('../utils/streakCalculator');

async function getWeeklyAnalytics(req, res, next) {
  try {
    const userId = req.user._id;
    const { start, end } = getWeekRange();

    const habits = await Habit.find({ userId, isActive: true });
    const completions = await Completion.find({ userId, date: { $gte: start, $lt: end } });

    let totalTarget = 0;
    for (const h of habits) {
      if (h.frequency === 'daily') {
        const created = normalizeDate(h.createdAt);
        const effectiveStart = created > start ? created : start;
        const daysActive = Math.max(0, Math.ceil((end - effectiveStart) / 86400000));
        totalTarget += Math.min(daysActive, 7);
      } else {
        totalTarget += h.target;
      }
    }

    const completedCount = completions.length;
    const score = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;

    const dailyHabits = habits.filter(h => h.frequency === 'daily');
    const streakCutoff = new Date();
    streakCutoff.setUTCDate(streakCutoff.getUTCDate() - 365);
    streakCutoff.setUTCHours(0, 0, 0, 0);
    const allCompletions = await Completion.find({ userId, date: { $gte: streakCutoff } }).sort({ date: -1 });
    const streak = calculateStreak(allCompletions, dailyHabits.length);

    const dayData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dayKey = d.toISOString().split('T')[0];
      const dayCompletions = completions.filter(c => normalizeDate(c.date).toISOString().split('T')[0] === dayKey);
      dayData.push({ date: dayKey, count: dayCompletions.length });
    }

    res.json({ score, completedCount, targetCount: totalTarget, streak, dayData });
  } catch (err) {
    next(err);
  }
}

async function getMonthlyAnalytics(req, res, next) {
  try {
    const userId = req.user._id;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const { start, end } = getMonthRange(month, year);

    const completions = await Completion.find({ userId, date: { $gte: start, $lt: end } }).populate('habitId', 'name icon color');

    const daysMap = {};
    for (const c of completions) {
      const key = normalizeDate(c.date).toISOString().split('T')[0];
      if (!daysMap[key]) daysMap[key] = [];
      daysMap[key].push(c);
    }

    const days = Object.entries(daysMap).map(([date, comps]) => ({ date, completions: comps }));
    res.json({ month, year, days });
  } catch (err) {
    next(err);
  }
}

async function getHabitAnalytics(req, res, next) {
  try {
    const userId = req.user._id;
    const habit = await Habit.findOne({ _id: req.params.id, userId });
    if (!habit) {
      return res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const recentCompletions = await Completion.find({
      habitId: habit._id,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    const habitCreated = normalizeDate(habit.createdAt);
    const effectiveStart = habitCreated > thirtyDaysAgo ? habitCreated : thirtyDaysAgo;
    const daysSinceCreation = Math.max(1, Math.ceil((new Date().setUTCHours(0,0,0,0) - effectiveStart) / 86400000) + 1);

    let expectedDays;
    if (habit.frequency === 'daily') {
      expectedDays = Math.min(daysSinceCreation, 30);
    } else {
      const weeksActive = daysSinceCreation / 7;
      expectedDays = Math.round(weeksActive * habit.target);
    }

    const completionRate = expectedDays > 0 ? Math.round((recentCompletions.length / expectedDays) * 100) : 0;

    let streakDays = 0;
    if (habit.frequency === 'daily') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const current = new Date(today);
      const dateSet = new Set(recentCompletions.map(c => normalizeDate(c.date).toISOString().split('T')[0]));
      while (dateSet.has(current.toISOString().split('T')[0])) {
        streakDays++;
        current.setUTCDate(current.getUTCDate() - 1);
      }
    }

    res.json({ completionRate, recentCompletions: recentCompletions.slice(0, 10), streakDays });
  } catch (err) {
    next(err);
  }
}

async function weeklyConsistency(req, res, next) {
  try {
    const userId = req.user._id;
    const weekParam = req.query.week;

    let weekStart;
    if (weekParam) {
      weekStart = normalizeDate(weekParam);
    } else {
      const now = new Date();
      const day = now.getUTCDay();
      const diff = day === 0 ? 6 : day - 1;
      weekStart = new Date(now);
      weekStart.setUTCDate(now.getUTCDate() - diff);
      weekStart.setUTCHours(0, 0, 0, 0);
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const habits = await Habit.find({ userId, isActive: true }).populate('categoryId', 'name color');
    const completions = await Completion.find({
      userId,
      date: { $gte: weekStart, $lt: weekEnd },
    });

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = normalizeDate(new Date());

    // Pre-index completions by habitId+date for O(1) lookup
    const completionMap = new Map();
    for (const c of completions) {
      const key = `${c.habitId.toString()}_${normalizeDate(c.date).toISOString().split('T')[0]}`;
      completionMap.set(key, c);
    }

    const habitRows = habits.map((habit) => {
      const days = {};
      let completedDays = 0;
      let totalHours = 0;
      const habitCreated = normalizeDate(habit.createdAt);

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setUTCDate(weekStart.getUTCDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = dayNames[i];

        const isFuture = d > today;
        const isBeforeCreation = d < habitCreated;

        if (isFuture || isBeforeCreation) {
          days[dayName] = { completed: false, value: 0, isFuture: true };
          continue;
        }

        const completion = completionMap.get(`${habit._id.toString()}_${dateStr}`);

        if (completion) {
          days[dayName] = { completed: true, value: completion.value };
          if (habit.trackingType === 'duration') {
            totalHours += completion.value;
          }
          completedDays++;
        } else {
          days[dayName] = { completed: false, value: 0, isFuture: false };
        }
      }

      const row = {
        habitId: habit._id,
        name: habit.name,
        icon: habit.icon,
        trackingType: habit.trackingType || 'checkmark',
        category: habit.categoryId ? { name: habit.categoryId.name, color: habit.categoryId.color } : null,
        days,
      };

      if (habit.trackingType === 'duration') {
        row.weeklyTarget = habit.weeklyTarget;
        row.totalHours = totalHours;
        row.rate = habit.weeklyTarget > 0 ? Math.min(totalHours / habit.weeklyTarget, 1) : 0;
      } else {
        const activeDays = Object.values(days).filter((d) => !d.isFuture).length;
        row.rate = activeDays > 0 ? completedDays / activeDays : 0;
      }

      return row;
    });

    const dailyScores = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setUTCDate(weekStart.getUTCDate() + i);
      const dayName = dayNames[i];
      const isFuture = d > today;

      if (isFuture) {
        dailyScores[dayName] = null;
        continue;
      }

      let completed = 0;
      let activeHabits = 0;
      for (const habit of habitRows) {
        if (!habit.days[dayName].isFuture) {
          activeHabits++;
          if (habit.days[dayName].completed) completed++;
        }
      }
      dailyScores[dayName] = activeHabits > 0 ? completed / activeHabits : null;
    }

    const activeDailyScores = Object.values(dailyScores).filter((s) => s !== null);
    const overallScore = activeDailyScores.length > 0
      ? activeDailyScores.reduce((a, b) => a + b, 0) / activeDailyScores.length
      : 0;

    res.json({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: new Date(weekEnd.getTime() - 86400000).toISOString().split('T')[0],
      habits: habitRows,
      dailyScores,
      overallScore: Math.round(overallScore * 100) / 100,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWeeklyAnalytics, getMonthlyAnalytics, getHabitAnalytics, weeklyConsistency };

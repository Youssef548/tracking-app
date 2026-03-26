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
      totalTarget += h.frequency === 'daily' ? 7 : h.target;
    }

    const completedCount = completions.length;
    const score = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;

    const dailyHabitCount = habits.filter(h => h.frequency === 'daily').length;
    const allCompletions = await Completion.find({ userId }).sort({ date: -1 });
    const streak = calculateStreak(allCompletions, dailyHabitCount);

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

    const completions = await Completion.find({ habitId: habit._id }).sort({ date: -1 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
    const recentCompletions = completions.filter(c => c.date >= thirtyDaysAgo);

    let expectedDays;
    if (habit.frequency === 'daily') {
      expectedDays = 30;
    } else {
      expectedDays = Math.round((30 / 7) * habit.target);
    }

    const completionRate = expectedDays > 0 ? Math.round((recentCompletions.length / expectedDays) * 100) : 0;

    let streakDays = 0;
    if (habit.frequency === 'daily') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const current = new Date(today);
      const dateSet = new Set(completions.map(c => normalizeDate(c.date).toISOString().split('T')[0]));
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

module.exports = { getWeeklyAnalytics, getMonthlyAnalytics, getHabitAnalytics };

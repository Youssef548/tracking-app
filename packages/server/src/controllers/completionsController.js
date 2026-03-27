const Completion = require('../models/Completion');
const Habit = require('../models/Habit');
const Notification = require('../models/Notification');
const { normalizeDate } = require('../utils/dateHelpers');
const { calculateStreak } = require('../utils/streakCalculator');
const { createNotification } = require('../utils/createNotification');

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);

async function getCompletions(req, res, next) {
  try {
    const filter = { userId: req.user._id };
    if (req.query.date) {
      const d = normalizeDate(req.query.date);
      const nextDay = new Date(d);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      filter.date = { $gte: d, $lt: nextDay };
    } else if (req.query.from && req.query.to) {
      filter.date = { $gte: normalizeDate(req.query.from), $lte: normalizeDate(req.query.to) };
    }
    const completions = await Completion.find(filter).populate('habitId', 'name icon color frequency').sort({ completedAt: -1 });
    res.json(completions);
  } catch (err) {
    next(err);
  }
}

async function createCompletion(req, res, next) {
  try {
    const { habitId, date, value, note } = req.body;
    const habit = await Habit.findOne({ _id: habitId, userId: req.user._id, isActive: true });
    if (!habit) {
      return res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
    }
    const completion = await Completion.create({
      habitId,
      userId: req.user._id,
      date: normalizeDate(date),
      value: value || 1,
      note: note || '',
    });
    // Notification triggers — run before response so tests can observe them;
    // errors are swallowed so they never affect the response.
    try {
      await fireCompletionNotifications(req.user._id, completion);
    } catch (_) {}

    res.status(201).json(completion);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'Already completed for this date', code: 'DUPLICATE' } });
    }
    next(err);
  }
}

async function fireCompletionNotifications(userId, completion) {
  const totalCompletions = await Completion.countDocuments({ userId });

  // 1. First completion ever
  if (totalCompletions === 1) {
    await createNotification(userId, 'achievement', 'First check-in', "Day one logged. That's the hardest one.");
    return;
  }

  // 2. Streak milestone
  const dailyHabits = await Habit.find({ userId, isActive: true, frequency: 'daily' });
  if (dailyHabits.length > 0) {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 365);
    cutoff.setUTCHours(0, 0, 0, 0);
    const allCompletions = await Completion.find({ userId, date: { $gte: cutoff } }).sort({ date: -1 });
    const streak = calculateStreak(allCompletions, dailyHabits.length);

    if (STREAK_MILESTONES.has(streak)) {
      const title = `🔥 ${streak}-day streak`;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
      const existing = await Notification.findOne({ userId, title, createdAt: { $gte: sevenDaysAgo } });
      if (!existing) {
        await createNotification(userId, 'streak', title, `You've completed all your habits for ${streak} days in a row.`);
      }
    }
  }

  // 3. Perfect week — fires on first completion of a new week if last week was 100%
  const getMondayOf = (d) => {
    const day = d.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - diff);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  };

  const todayNorm = normalizeDate(new Date());
  const thisWeekMonday = getMondayOf(todayNorm);

  const prevCompletion = await Completion.findOne({
    userId,
    _id: { $ne: completion._id },
  }).sort({ date: -1 });

  if (prevCompletion) {
    const prevDate = normalizeDate(prevCompletion.date);
    const prevWeekMonday = getMondayOf(prevDate);

    if (thisWeekMonday > prevWeekMonday) {
      // First completion of a new week — evaluate last week
      const lastWeekStart = new Date(thisWeekMonday);
      lastWeekStart.setUTCDate(thisWeekMonday.getUTCDate() - 7);
      const lastWeekEnd = new Date(thisWeekMonday);

      const lastWeekCompletions = await Completion.countDocuments({
        userId,
        date: { $gte: lastWeekStart, $lt: lastWeekEnd },
      });

      const habits = await Habit.find({ userId, isActive: true });
      let totalTarget = 0;
      for (const h of habits) {
        totalTarget += h.frequency === 'daily' ? 7 : h.target;
      }

      if (totalTarget > 0 && lastWeekCompletions >= totalTarget) {
        const title = 'Perfect week';
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
        const existing = await Notification.findOne({ userId, title, createdAt: { $gte: sevenDaysAgo } });
        if (!existing) {
          await createNotification(userId, 'achievement', 'Perfect week', "You hit every target last week. That's rare — keep it going.");
        }
      }
    }
  }
}

async function deleteCompletion(req, res, next) {
  try {
    const completion = await Completion.findOne({ _id: req.params.id, userId: req.user._id });
    if (!completion) {
      return res.status(404).json({ error: { message: 'Completion not found', code: 'NOT_FOUND' } });
    }
    await Completion.deleteOne({ _id: req.params.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getCompletions, createCompletion, deleteCompletion };

const Completion = require('../models/Completion');
const Habit = require('../models/Habit');
const { normalizeDate } = require('../utils/dateHelpers');

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
    res.status(201).json(completion);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: { message: 'Already completed for this date', code: 'DUPLICATE' } });
    }
    next(err);
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

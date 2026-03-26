const Habit = require('../models/Habit');

async function getHabits(req, res, next) {
  try {
    const filter = { userId: req.user._id };
    if (req.query.active !== 'false') {
      filter.isActive = true;
    }
    const habits = await Habit.find(filter).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    next(err);
  }
}

async function createHabit(req, res, next) {
  try {
    const { name, icon, color, frequency, target, description } = req.body;
    const habit = await Habit.create({
      userId: req.user._id,
      name,
      icon: icon || 'check_circle',
      color: color || 'primary',
      frequency,
      target: frequency === 'daily' ? 1 : (target || 1),
      description: description || '',
    });
    res.status(201).json(habit);
  } catch (err) {
    next(err);
  }
}

async function updateHabit(req, res, next) {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
    }
    const allowed = ['name', 'icon', 'color', 'frequency', 'target', 'description'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        habit[key] = req.body[key];
      }
    }
    if (habit.frequency === 'daily') habit.target = 1;
    await habit.save();
    res.json(habit);
  } catch (err) {
    next(err);
  }
}

async function deleteHabit(req, res, next) {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
    }
    habit.isActive = false;
    await habit.save();
    res.json(habit);
  } catch (err) {
    next(err);
  }
}

module.exports = { getHabits, createHabit, updateHabit, deleteHabit };

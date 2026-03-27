import { Request, Response, NextFunction } from 'express';
import Habit from '../models/Habit';
import { createNotification } from '../utils/createNotification';

export async function getHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (req.query['active'] !== 'false') {
      filter['isActive'] = true;
    }
    const habits = await Habit.find(filter).sort({ createdAt: -1 }).populate('categoryId', 'name color');
    res.json(habits);
  } catch (err) {
    next(err);
  }
}

export async function createHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, icon, color, frequency, target, description, categoryId, trackingType, weeklyTarget } =
      req.body as {
        name: string;
        icon?: string;
        color?: string;
        frequency?: string;
        target?: number;
        description?: string;
        categoryId?: string;
        trackingType?: string;
        weeklyTarget?: number;
      };
    const habit = await Habit.create({
      userId: req.user!._id,
      name,
      icon: icon ?? 'check_circle',
      color: color ?? 'primary',
      frequency: trackingType === 'duration' ? 'weekly' : frequency,
      target: frequency === 'daily' ? 1 : (target ?? 1),
      description: description ?? '',
      categoryId: categoryId ?? null,
      trackingType: trackingType ?? 'checkmark',
      weeklyTarget: trackingType === 'duration' ? weeklyTarget : null,
    });
    const populated = await habit.populate('categoryId', 'name color');

    // First-habit notification (fire-and-forget)
    const habitCount = await Habit.countDocuments({ userId: req.user!._id, isActive: true });
    if (habitCount === 1) {
      await createNotification(
        req.user!._id,
        'achievement',
        "You're on your way",
        'Your first habit is set. Show up tomorrow and the streak begins.',
      );
    }

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
}

export async function updateHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const habit = await Habit.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!habit) {
      res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
      return;
    }
    const allowed = ['name', 'icon', 'color', 'frequency', 'target', 'description', 'categoryId', 'trackingType', 'weeklyTarget'] as const;
    const body = req.body as Partial<Record<(typeof allowed)[number], unknown>>;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        (habit as unknown as Record<string, unknown>)[key] = body[key];
      }
    }
    if (habit.frequency === 'daily') habit.target = 1;
    if (habit.trackingType === 'duration') {
      habit.frequency = 'weekly';
    }
    if (habit.trackingType === 'checkmark') {
      habit.weeklyTarget = null;
    }
    await habit.save();
    const populated = await habit.populate('categoryId', 'name color');
    res.json(populated);
  } catch (err) {
    next(err);
  }
}

export async function deleteHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const habit = await Habit.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!habit) {
      res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
      return;
    }
    habit.isActive = false;
    await habit.save();
    res.json(habit);
  } catch (err) {
    next(err);
  }
}

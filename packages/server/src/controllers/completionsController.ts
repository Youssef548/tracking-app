import { Request, Response, NextFunction } from 'express';
import Completion, { CompletionDocument } from '../models/Completion';
import Habit from '../models/Habit';
import Notification from '../models/Notification';
import { normalizeDate } from '../utils/dateHelpers';
import { calculateStreak } from '../utils/streakCalculator';
import { createNotification } from '../utils/createNotification';
import type { Types } from 'mongoose';

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);

export async function getCompletions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: Record<string, unknown> = { userId: req.user!._id };
    if (req.query['date']) {
      const d = normalizeDate(req.query['date'] as string);
      const nextDay = new Date(d);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      filter['date'] = { $gte: d, $lt: nextDay };
    } else if (req.query['from'] && req.query['to']) {
      filter['date'] = {
        $gte: normalizeDate(req.query['from'] as string),
        $lte: normalizeDate(req.query['to'] as string),
      };
    }
    const completions = await Completion.find(filter)
      .populate('habitId', 'name icon color frequency')
      .sort({ completedAt: -1 });
    res.json(completions);
  } catch (err) {
    next(err);
  }
}

export async function createCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { habitId, date, value, note } = req.body as {
      habitId: string;
      date: string;
      value?: number;
      note?: string;
    };
    const habit = await Habit.findOne({ _id: habitId, userId: req.user!._id, isActive: true });
    if (!habit) {
      res.status(404).json({ error: { message: 'Habit not found', code: 'NOT_FOUND' } });
      return;
    }
    const completion = await Completion.create({
      habitId,
      userId: req.user!._id,
      date: normalizeDate(date),
      value: value ?? 1,
      note: note ?? '',
    });
    // Notification triggers — run before response so tests can observe them;
    // errors are swallowed so they never affect the response.
    try {
      await fireCompletionNotifications(req.user!._id, completion);
    } catch {
      // swallow
    }

    res.status(201).json(completion);
  } catch (err) {
    const mongoErr = err as { code?: number };
    if (mongoErr.code === 11000) {
      res.status(409).json({ error: { message: 'Already completed for this date', code: 'DUPLICATE' } });
      return;
    }
    next(err);
  }
}

async function fireCompletionNotifications(
  userId: Types.ObjectId,
  completion: CompletionDocument,
): Promise<void> {
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
    const streak = calculateStreak(allCompletions as CompletionDocument[], dailyHabits.length);

    if (STREAK_MILESTONES.has(streak)) {
      const title = `🔥 ${streak}-day streak`;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
      const existing = await Notification.findOne({ userId, title, createdAt: { $gte: sevenDaysAgo } });
      if (!existing) {
        await createNotification(
          userId,
          'streak',
          title,
          `You've completed all your habits for ${streak} days in a row.`,
        );
      }
    }
  }

  // 3. Perfect week — fires on first completion of a new week if last week was 100%
  const getMondayOf = (d: Date): Date => {
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
          await createNotification(
            userId,
            'achievement',
            'Perfect week',
            "You hit every target last week. That's rare — keep it going.",
          );
        }
      }
    }
  }
}

export async function deleteCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const completion = await Completion.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!completion) {
      res.status(404).json({ error: { message: 'Completion not found', code: 'NOT_FOUND' } });
      return;
    }
    await Completion.deleteOne({ _id: req.params['id'] });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

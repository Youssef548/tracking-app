import { Request, Response, NextFunction } from 'express';
import WeeklyPlan from '../models/WeeklyPlan';

export async function getWeeklyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weekKey } = req.params as { weekKey: string };
    const plan = await WeeklyPlan.findOne({ userId: req.user!._id, weekKey });
    if (!plan) {
      res.status(404).json({ error: { message: 'Weekly plan not found', code: 'NOT_FOUND' } });
      return;
    }
    res.json(plan);
  } catch (err) {
    next(err);
  }
}

export async function upsertWeeklyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weekKey } = req.params as { weekKey: string };
    const { habitTargetOverrides, weekNote } = req.body as {
      habitTargetOverrides?: { habitId: string; targetDays: number }[];
      weekNote?: string;
    };
    const plan = await WeeklyPlan.findOneAndUpdate(
      { userId: req.user!._id, weekKey },
      { $set: { habitTargetOverrides: habitTargetOverrides ?? [], weekNote: weekNote ?? '' } },
      { upsert: true, new: true },
    );
    res.json(plan);
  } catch (err) {
    next(err);
  }
}

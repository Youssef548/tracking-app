import { Request, Response, NextFunction } from 'express';
import MonthlyGoalItem from '../models/MonthlyGoalItem';

export async function getMonthlyGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { monthKey } = req.params as { monthKey: string };
    const goals = await MonthlyGoalItem.find({ userId: req.user!._id, monthKey });
    res.json(goals);
  } catch (err) {
    next(err);
  }
}

export async function upsertMonthlyGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { monthKey, habitId } = req.params as { monthKey: string; habitId: string };
    const { items } = req.body as {
      items?: { text: string; completed: boolean; order: number }[];
    };
    const goal = await MonthlyGoalItem.findOneAndUpdate(
      { userId: req.user!._id, habitId, monthKey },
      { $set: { items: items ?? [] } },
      { upsert: true, new: true },
    );
    res.json(goal);
  } catch (err) {
    next(err);
  }
}

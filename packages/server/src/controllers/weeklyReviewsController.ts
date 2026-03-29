import { Request, Response, NextFunction } from 'express';
import WeeklyReview from '../models/WeeklyReview';

export async function getWeeklyReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weekKey } = req.params as { weekKey: string };
    const review = await WeeklyReview.findOne({ userId: req.user!._id, weekKey });
    if (!review) {
      res.status(404).json({ error: { message: 'Weekly review not found', code: 'NOT_FOUND' } });
      return;
    }
    res.json(review);
  } catch (err) {
    next(err);
  }
}

export async function upsertWeeklyReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weekKey } = req.params as { weekKey: string };
    const { wentWell, toImprove, changesNextWeek, totals } = req.body as {
      wentWell?: string;
      toImprove?: string;
      changesNextWeek?: string;
      totals?: { habitId: string; habitName: string; done: number; target: number }[];
    };
    const update: Record<string, unknown> = {};
    if (wentWell !== undefined) update['wentWell'] = wentWell;
    if (toImprove !== undefined) update['toImprove'] = toImprove;
    if (changesNextWeek !== undefined) update['changesNextWeek'] = changesNextWeek;
    if (totals !== undefined) update['totals'] = totals;
    const review = await WeeklyReview.findOneAndUpdate(
      { userId: req.user!._id, weekKey },
      { $set: update },
      { upsert: true, new: true },
    );
    res.json(review);
  } catch (err) {
    next(err);
  }
}

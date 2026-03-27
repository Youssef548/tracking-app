import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await Notification.find({ userId: req.user!._id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await Notification.findOne({ _id: req.params['id'], userId: req.user!._id });
    if (!notification) {
      res.status(404).json({ error: { message: 'Notification not found', code: 'NOT_FOUND' } });
      return;
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Notification.updateMany({ userId: req.user!._id, isRead: false }, { isRead: true });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

import Notification from '../models/Notification';
import type { INotification } from '../models/Notification';
import type { Types } from 'mongoose';

export async function createNotification(
  userId: Types.ObjectId | string,
  type: INotification['type'],
  title: string,
  message: string,
): Promise<void> {
  try {
    await Notification.create({ userId, type, title, message });
  } catch {
    // Fire-and-forget — notification failures must never affect the main request
  }
}

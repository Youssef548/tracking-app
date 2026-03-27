import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { NOTIFICATION_TYPES } from '@mindful-flow/shared/constants';

export interface INotification {
  userId: Types.ObjectId;
  type: 'streak' | 'reminder' | 'achievement' | 'tip';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = Document & INotification;
type NotificationModel = Model<INotification>;

const NotificationSchema = new Schema<INotification, NotificationModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<INotification, NotificationModel>('Notification', NotificationSchema);

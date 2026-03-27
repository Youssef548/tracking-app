import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { FREQUENCIES, COLORS, TRACKING_TYPES } from '@mindful-flow/shared/constants';

export interface IHabit {
  userId: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  target: number;
  description: string;
  categoryId: Types.ObjectId | null;
  trackingType: 'checkmark' | 'duration';
  weeklyTarget: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type HabitDocument = Document & IHabit;
type HabitModel = Model<IHabit>;

const HabitSchema = new Schema<IHabit, HabitModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Habit name is required'], trim: true, maxlength: 100 },
    icon: { type: String, default: 'check_circle' },
    color: { type: String, enum: COLORS, default: 'primary' },
    frequency: { type: String, enum: Object.values(FREQUENCIES), required: true },
    target: { type: Number, default: 1, min: 1, max: 7 },
    description: { type: String, default: '', maxlength: 255 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    trackingType: { type: String, enum: Object.values(TRACKING_TYPES), default: 'checkmark' },
    weeklyTarget: { type: Number, default: null, min: 1, max: 168 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

HabitSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IHabit, HabitModel>('Habit', HabitSchema);

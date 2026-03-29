import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IHabitTargetOverride {
  habitId: Types.ObjectId;
  targetDays: number;
}

export interface IWeeklyPlan {
  userId: Types.ObjectId;
  weekKey: string;
  habitTargetOverrides: IHabitTargetOverride[];
  weekNote: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WeeklyPlanDocument = Document & IWeeklyPlan;

const WeeklyPlanSchema = new Schema<IWeeklyPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekKey: { type: String, required: true },
    habitTargetOverrides: [
      {
        habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
        targetDays: { type: Number, required: true, min: 1, max: 7 },
      },
    ],
    weekNote: { type: String, default: '' },
  },
  { timestamps: true },
);

WeeklyPlanSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

export default mongoose.model<IWeeklyPlan>('WeeklyPlan', WeeklyPlanSchema);

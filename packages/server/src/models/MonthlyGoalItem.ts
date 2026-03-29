import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGoalItem {
  _id?: Types.ObjectId;
  text: string;
  completed: boolean;
  order: number;
}

export interface IMonthlyGoalItem {
  userId: Types.ObjectId;
  habitId: Types.ObjectId;
  monthKey: string;
  items: IGoalItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type MonthlyGoalItemDocument = Document & IMonthlyGoalItem;

const GoalItemSchema = new Schema<IGoalItem>(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: true },
);

const MonthlyGoalItemSchema = new Schema<IMonthlyGoalItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
    monthKey: { type: String, required: true },
    items: [GoalItemSchema],
  },
  { timestamps: true },
);

MonthlyGoalItemSchema.index({ userId: 1, habitId: 1, monthKey: 1 }, { unique: true });

export default mongoose.model<IMonthlyGoalItem>('MonthlyGoalItem', MonthlyGoalItemSchema);

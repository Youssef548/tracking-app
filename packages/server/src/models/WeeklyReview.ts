import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITotalsEntry {
  habitId: Types.ObjectId;
  habitName: string;
  done: number;
  target: number;
}

export interface IWeeklyReview {
  userId: Types.ObjectId;
  weekKey: string;
  wentWell: string;
  toImprove: string;
  changesNextWeek: string;
  totals: ITotalsEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export type WeeklyReviewDocument = Document & IWeeklyReview;

const TotalsEntrySchema = new Schema<ITotalsEntry>(
  {
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
    habitName: { type: String, required: true },
    done: { type: Number, required: true },
    target: { type: Number, required: true },
  },
  { _id: false },
);

const WeeklyReviewSchema = new Schema<IWeeklyReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekKey: { type: String, required: true },
    wentWell: { type: String, default: '' },
    toImprove: { type: String, default: '' },
    changesNextWeek: { type: String, default: '' },
    totals: [TotalsEntrySchema],
  },
  { timestamps: true },
);

WeeklyReviewSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

export default mongoose.model<IWeeklyReview>('WeeklyReview', WeeklyReviewSchema);

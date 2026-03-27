import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ICompletion {
  userId: Types.ObjectId;
  habitId: Types.ObjectId;
  date: Date;
  value: number;
  note: string;
  completedAt: Date;
}

export type CompletionDocument = Document & ICompletion;
type CompletionModel = Model<ICompletion>;

const CompletionSchema = new Schema<ICompletion, CompletionModel>(
  {
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    value: { type: Number, default: 1, min: 0 },
    note: { type: String, default: '', maxlength: 500 },
    completedAt: { type: Date, default: Date.now },
  },
);

CompletionSchema.index({ userId: 1, date: 1 });
CompletionSchema.index({ habitId: 1, date: 1 }, { unique: true });

export default mongoose.model<ICompletion, CompletionModel>('Completion', CompletionSchema);

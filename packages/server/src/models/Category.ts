import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ICategory {
  userId: Types.ObjectId;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = Document & ICategory;
type CategoryModel = Model<ICategory>;

const CategorySchema = new Schema<ICategory, CategoryModel>(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 50 },
    color: { type: String, required: [true, 'Color is required'], match: /^#[0-9a-fA-F]{6}$/ },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICategory, CategoryModel>('Category', CategorySchema);

import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  name: string;
  email: string;
  password: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = Document & IUser & IUserMethods;
type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    avatar: { type: String, default: '' },
  },
  { timestamps: true },
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = process.env['E2E'] === 'true' || process.env['NODE_ENV'] === 'test' ? 1 : 10;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password as string);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj['password'];
  return obj;
};

export default mongoose.model<IUser, UserModel>('User', UserSchema);

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_EXPIRES_IN = '7d';

function generateToken(userId: unknown): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: { message: 'Email already registered', code: 'EMAIL_EXISTS' } });
      return;
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' } });
      return;
    }
    const token = generateToken(user._id);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, currentPassword, password } = req.body as {
      name?: string;
      email?: string;
      currentPassword?: string;
      password?: string;
    };
    const user = req.user!;

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined && email.toLowerCase() !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (taken) {
        res.status(409).json({ error: { message: 'Email already in use', code: 'EMAIL_TAKEN' } });
        return;
      }
      user.email = email.toLowerCase();
    }

    if (password !== undefined) {
      if (!currentPassword) {
        res.status(400).json({ error: { message: 'Current password is required', code: 'MISSING_CURRENT_PASSWORD' } });
        return;
      }
      const correct = await user.comparePassword(currentPassword);
      if (!correct) {
        res.status(400).json({ error: { message: 'Current password is incorrect', code: 'WRONG_PASSWORD' } });
        return;
      }
      user.password = password;
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

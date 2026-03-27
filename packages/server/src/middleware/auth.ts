import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
  userId: string;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'No token provided', code: 'NO_TOKEN' } });
    return;
  }
  try {
    const token = header.split(' ')[1];
    const secret = process.env['JWT_SECRET'];
    if (!secret) throw new Error('JWT_SECRET not configured');
    const decoded = jwt.verify(token as string, secret) as JwtPayload;
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid token', code: 'INVALID_TOKEN' } });
  }
}

export default authenticate;

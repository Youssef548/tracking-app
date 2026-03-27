import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateAuthInput } from '@mindful-flow/shared/validation';
import { validate, type ValidationFn } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { register, login, getMe, updateProfile } from '../controllers/authController';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: { message: 'Too many attempts, try again later', code: 'RATE_LIMIT' } },
  skip: () => process.env['NODE_ENV'] === 'test' || process.env['E2E'] === 'true',
});

const authValidator = validateAuthInput as unknown as ValidationFn;

router.post('/register', authLimiter, validate(authValidator, false), register);
router.post('/login', authLimiter, validate(authValidator, true), login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;

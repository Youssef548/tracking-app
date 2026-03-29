import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMonthlyGoals, upsertMonthlyGoal } from '../controllers/monthlyGoalsController';

const router = Router();
router.use(authenticate);
router.get('/:monthKey', getMonthlyGoals);
router.put('/:monthKey/:habitId', upsertMonthlyGoal);

export default router;

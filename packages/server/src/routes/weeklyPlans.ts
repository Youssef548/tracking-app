import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWeeklyPlan, upsertWeeklyPlan } from '../controllers/weeklyPlansController';

const router = Router();
router.use(authenticate);
router.get('/:weekKey', getWeeklyPlan);
router.put('/:weekKey', upsertWeeklyPlan);

export default router;

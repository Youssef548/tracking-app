import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getHabitAnalytics,
  weeklyConsistency,
} from '../controllers/analyticsController';

const router = Router();

router.use(authenticate);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/habits/:id', getHabitAnalytics);
router.get('/weekly-consistency', weeklyConsistency);

export default router;

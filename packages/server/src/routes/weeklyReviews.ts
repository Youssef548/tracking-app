import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWeeklyReview, upsertWeeklyReview } from '../controllers/weeklyReviewsController';

const router = Router();
router.use(authenticate);
router.get('/:weekKey', getWeeklyReview);
router.put('/:weekKey', upsertWeeklyReview);

export default router;

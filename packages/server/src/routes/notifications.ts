import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationsController';

const router = Router();

router.use(authenticate);
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;

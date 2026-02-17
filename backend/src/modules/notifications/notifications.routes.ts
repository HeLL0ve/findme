import { Router } from 'express';
import { authMiddleware } from '../auth/middleware/auth.middleware';
import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  unreadCountController,
} from './controllers/notifications.controller';

const router = Router();

router.get('/', authMiddleware, listNotificationsController);
router.get('/unread-count', authMiddleware, unreadCountController);
router.post('/read-all', authMiddleware, markAllNotificationsReadController);
router.post('/:id/read', authMiddleware, markNotificationReadController);

export default router;

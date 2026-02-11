import { Router } from 'express';
import { authMiddleware, adminOnly } from '../auth/middleware/auth.middleware';
import { adminStatsController } from './controllers/stats.controller';

const router = Router();

router.get('/stats', authMiddleware, adminOnly, adminStatsController);

export default router;

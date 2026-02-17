import { Router } from 'express';
import { authMiddleware, adminOnly } from '../auth/middleware/auth.middleware';
import { adminStatsController } from './controllers/stats.controller';
import { listComplaintsController, reviewComplaintController } from './controllers/complaints.controller';

const router = Router();

router.get('/stats', authMiddleware, adminOnly, adminStatsController);
router.get('/complaints', authMiddleware, adminOnly, listComplaintsController);
router.post('/complaints/:id/review', authMiddleware, adminOnly, reviewComplaintController);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../auth/middleware/auth.middleware';
import { createComplaintController, listMyComplaintsController } from './controllers/complaint.controller';

const router = Router();

router.post('/', authMiddleware, createComplaintController);
router.get('/my', authMiddleware, listMyComplaintsController);

export default router;

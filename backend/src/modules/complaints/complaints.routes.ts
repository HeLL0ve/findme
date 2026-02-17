import { Router } from 'express';
import { authMiddleware } from '../auth/middleware/auth.middleware';
import { createComplaintController } from './controllers/complaint.controller';

const router = Router();

router.post('/', authMiddleware, createComplaintController);

export default router;

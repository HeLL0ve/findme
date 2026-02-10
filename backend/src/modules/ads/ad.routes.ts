import { Router } from 'express';
import { createAdController, listAdsController, getAdController, moderateAdController } from './controllers/ad.controller';
import { authMiddleware, adminOnly } from '../auth/middleware/auth.middleware';
import { uploadPhotosController, uploadMiddleware } from './controllers/upload.controller';

const router = Router();

router.get('/', listAdsController);
router.get('/:id', getAdController);
router.post('/', authMiddleware, createAdController);
router.post('/upload', authMiddleware, uploadMiddleware, uploadPhotosController);
router.post('/:id/moderate', authMiddleware, adminOnly, moderateAdController);

export default router;

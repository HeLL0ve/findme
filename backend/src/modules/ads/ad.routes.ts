import { Router } from 'express';
import {
  createAdController,
  listAdsController,
  getAdController,
  moderateAdController,
  updateAdController,
  listMyAdsController,
  listPendingAdsController,
  markFoundController,
} from './controllers/ad.controller';
import { authMiddleware, adminOnly, optionalAuthMiddleware } from '../auth/middleware/auth.middleware';
import { uploadPhotosController, uploadMiddleware } from './controllers/upload.controller';

const router = Router();

router.get('/', optionalAuthMiddleware, listAdsController);
router.get('/my', authMiddleware, listMyAdsController);
router.get('/pending', authMiddleware, adminOnly, listPendingAdsController);
router.get('/:id', optionalAuthMiddleware, getAdController);

router.post('/', authMiddleware, createAdController);
router.post('/upload', authMiddleware, uploadMiddleware, uploadPhotosController);
router.post('/:id/moderate', authMiddleware, adminOnly, moderateAdController);
router.post('/:id/found', authMiddleware, markFoundController);
router.patch('/:id', authMiddleware, updateAdController);

export default router;

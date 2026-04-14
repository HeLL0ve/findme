import { Router } from 'express';
import { authMiddleware } from '../auth/middleware/auth.middleware';
import { telegramLinkController, telegramStatusController, telegramUnlinkController } from './telegram.controller';

const router = Router();

router.get('/link', authMiddleware, telegramLinkController);
router.get('/status', authMiddleware, telegramStatusController);
router.post('/unlink', authMiddleware, telegramUnlinkController);

export default router;

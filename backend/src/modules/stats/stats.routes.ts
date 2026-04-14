import { Router } from 'express';
import { publicStatsController } from './stats.controller';

const router = Router();

// Публичная статистика (доступна без авторизации)
router.get('/', publicStatsController);

export default router;

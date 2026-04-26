import { Router } from 'express';
import { healthCheck, getPublicConfig } from './health.controller';

const router = Router();

router.get('/', healthCheck);
router.get('/config', getPublicConfig);

export default router;

import { Router } from 'express';
import { getProfileController, updateProfileController } from './controllers/profile.controller';
import { authMiddleware, adminOnly } from '../auth/middleware/auth.middleware';
import { blockUserController, changeRoleController } from './controllers/admin.controller';
import { listUsersController } from './controllers/list.controller';

const router = Router();

router.get('/me', authMiddleware, getProfileController);
router.put('/me', authMiddleware, updateProfileController);

// admin actions
router.post('/:id/block', authMiddleware, adminOnly, blockUserController);
router.post('/:id/role', authMiddleware, adminOnly, changeRoleController);
router.get('/', authMiddleware, adminOnly, listUsersController);

export default router;

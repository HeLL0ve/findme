import { Router } from 'express';
import { changePasswordController, getProfileController, updateProfileController } from './controllers/profile.controller';
import { authMiddleware, adminOnly } from '../auth/middleware/auth.middleware';
import { blockUserController, changeRoleController } from './controllers/admin.controller';
import { listUsersController } from './controllers/list.controller';
import { uploadAvatarController, uploadAvatarMiddleware } from './controllers/avatar.controller';

const router = Router();

router.get('/me', authMiddleware, getProfileController);
router.put('/me', authMiddleware, updateProfileController);
router.post('/me/avatar', authMiddleware, uploadAvatarMiddleware, uploadAvatarController);
router.post('/me/change-password', authMiddleware, changePasswordController);

// admin actions
router.post('/:id/block', authMiddleware, adminOnly, blockUserController);
router.post('/:id/role', authMiddleware, adminOnly, changeRoleController);
router.get('/', authMiddleware, adminOnly, listUsersController);

export default router;

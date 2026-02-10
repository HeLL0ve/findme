import { Router } from 'express';
import { loginController } from './controllers/login.controller';
import { registerController } from './controllers/register.controller';
import { refreshController } from './controllers/refresh.controller';
import { logoutController } from './controllers/logout.controller';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

export default router;
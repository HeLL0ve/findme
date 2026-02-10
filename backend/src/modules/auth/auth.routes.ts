import { Router } from 'express';
import { loginController } from './controllers/login.controller';
import { registerController } from './controllers/register.controller';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);

export default router;
import { Router } from 'express';
import { loginController } from './controllers/login.controller';
import { registerController } from './controllers/register.controller';
import { refreshController } from './controllers/refresh.controller';
import { logoutController } from './controllers/logout.controller';
import {
  forgotPasswordController,
  resendVerificationController,
  resetPasswordController,
  verifyEmailController,
} from './controllers/email-auth.controller';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.post('/verify-email', verifyEmailController);
router.post('/resend-verification', resendVerificationController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

export default router;

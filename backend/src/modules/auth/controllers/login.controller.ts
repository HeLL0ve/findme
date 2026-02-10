import { Request, Response } from 'express';
import { loginSchema } from '../schemas/login.schemas';
import { loginService } from '../services/login.service';

export async function loginController(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: parsed.error.flatten(),
    });
  }

  const result = await loginService(parsed.data);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/auth',
  });

  return res.json({
    accessToken: result.accessToken,
    user: result.user,
  });
}
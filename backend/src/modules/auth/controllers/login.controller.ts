import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '../schemas/login.schemas';
import { loginService } from '../services/login.service';
import { ApiError } from '../../../shared/errors/apiError';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(ApiError.validation(parsed.error.flatten()));
  }

  try {
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
  } catch (err) {
    return next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await tokenService.deleteRefreshToken(token);
    }

    res.clearCookie('refreshToken', { path: '/auth' });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

import { Request, Response } from 'express';
import { tokenService } from '../services/token.service';

export async function logoutController(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;

  if (token) {
    await tokenService.deleteRefreshToken(token);
  }

  res.clearCookie('refreshToken', { path: '/auth' });

  return res.json({ ok: true });
}

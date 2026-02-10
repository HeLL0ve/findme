import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { tokenService } from '../services/token.service';
import { prisma } from '../../../config/prisma';

export async function refreshController(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ code: 'NO_REFRESH_TOKEN' });
  }

  try {
    const payload = jwt.verify(token, env.jwtRefreshSecret) as { userId: string };

    const exists = await tokenService.verifyTokenExists(token);
    if (!exists) {
      return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN' });
    }

    // rotate tokens
    await tokenService.deleteRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ code: 'USER_NOT_FOUND' });

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      env.jwtAccessSecret,
      { expiresIn: '15m' }
    );

    const newRefresh = jwt.sign({ userId: user.id }, env.jwtRefreshSecret, { expiresIn: '7d' });
    const ttl = 7 * 24 * 60 * 60;
    await tokenService.saveRefreshToken(newRefresh, user.id, ttl);

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/auth',
    });

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN' });
  }
}

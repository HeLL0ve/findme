import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { tokenService } from '../services/token.service';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return next(new ApiError('NO_REFRESH_TOKEN', 'Нет refresh token', 401));
  }

  try {
    const payload = jwt.verify(token, env.jwtRefreshSecret) as { userId: string };

    const exists = await tokenService.verifyTokenExists(token);
    if (!exists) {
      return next(new ApiError('INVALID_REFRESH_TOKEN', 'Неверный refresh token', 401));
    }

    // rotate tokens
    await tokenService.deleteRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return next(new ApiError('USER_NOT_FOUND', 'Пользователь не найден', 401));
    if (user.isBlocked) return next(new ApiError('USER_BLOCKED', 'Пользователь заблокирован', 403));

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
    return next(new ApiError('INVALID_REFRESH_TOKEN', 'Неверный refresh token', 401));
  }
}

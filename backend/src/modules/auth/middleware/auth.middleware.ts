import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AuthError } from '../auth.errors';
import { prisma } from '../../../config/prisma';

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return next(new AuthError('NO_AUTH_TOKEN', 'Токен не предоставлен', 401));

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new AuthError('INVALID_AUTH_FORMAT', 'Неверный формат токена', 401));
  }

  try {
    const payload = jwt.verify(parts[1], env.jwtAccessSecret) as { userId: string; role: string };

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return next(new AuthError('USER_NOT_FOUND', 'Пользователь не найден', 401));
    if (user.isBlocked) return next(new AuthError('USER_BLOCKED', 'Пользователь заблокирован', 403));

    // attach to request
    (req as any).user = { userId: payload.userId, role: payload.role };

    return next();
  } catch (err) {
    return next(new AuthError('INVALID_TOKEN', 'Неверный или просроченный токен', 401));
  }
}

export function adminOnly(req: Request, _res: Response, next: NextFunction) {
  const u = (req as any).user;
  if (!u) return next(new AuthError('NO_AUTH', 'Требуется авторизация', 401));
  if (u.role !== 'ADMIN') return next(new AuthError('FORBIDDEN', 'Только для администраторов', 403));
  return next();
}

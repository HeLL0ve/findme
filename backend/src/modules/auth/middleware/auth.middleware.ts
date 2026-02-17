import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AuthError } from '../auth.errors';
import { prisma } from '../../../config/prisma';

type AccessPayload = {
  userId: string;
  role: 'USER' | 'ADMIN';
};

function extractAccessPayload(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.jwtAccessSecret);

  if (!decoded || typeof decoded !== 'object') {
    throw new AuthError('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  const payload = decoded as JwtPayload;
  const userId = payload.userId;
  const role = payload.role;

  if (typeof userId !== 'string' || (role !== 'USER' && role !== 'ADMIN')) {
    throw new AuthError('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  return { userId, role };
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return next(new AuthError('NO_AUTH_TOKEN', 'Token is not provided', 401));

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new AuthError('INVALID_AUTH_FORMAT', 'Invalid token format', 401));
  }

  try {
    const token = parts[1];
    if (!token) return next(new AuthError('INVALID_AUTH_FORMAT', 'Invalid token format', 401));
    const payload = extractAccessPayload(token);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return next(new AuthError('USER_NOT_FOUND', 'User not found', 401));
    if (user.isBlocked) return next(new AuthError('USER_BLOCKED', 'User is blocked', 403));

    req.user = { userId: payload.userId, role: user.role };

    return next();
  } catch (_err) {
    return next(new AuthError('INVALID_TOKEN', 'Invalid or expired token', 401));
  }
}

export async function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return next();

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return next();

  try {
    const token = parts[1];
    if (!token) return next();
    const payload = extractAccessPayload(token);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.isBlocked) return next();

    req.user = { userId: payload.userId, role: user.role };
  } catch (_err) {
    // ignore invalid tokens for optional auth
  }

  return next();
}

export function adminOnly(req: Request, _res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return next(new AuthError('NO_AUTH', 'Authorization is required', 401));
  if (user.role !== 'ADMIN') return next(new AuthError('FORBIDDEN', 'Admin access only', 403));
  return next();
}

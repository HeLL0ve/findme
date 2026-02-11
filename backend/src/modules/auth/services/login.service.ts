import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/prisma';
import { env } from '../../../config/env';
import { AuthError } from '../auth.errors';
import { tokenService } from './token.service';

type LoginInput = {
  email: string;
  password: string;
};

export async function loginService(data: LoginInput) {
  const { email, password } = data;

  if (!email || !password) {
    throw AuthError.validation('Email и пароль обязательны');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw AuthError.invalidCredentials();
  }
  if (user.isBlocked) {
    throw new AuthError('USER_BLOCKED', 'Пользователь заблокирован', 403);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw AuthError.invalidCredentials();
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.jwtAccessSecret,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    env.jwtRefreshSecret,
    { expiresIn: '7d' }
  );

  // Save refresh token in Redis with TTL (7 days)
  const ttl = 7 * 24 * 60 * 60; // seconds
  await tokenService.saveRefreshToken(refreshToken, user.id, ttl);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

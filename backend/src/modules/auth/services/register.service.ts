import bcrypt from 'bcrypt';
import { prisma } from '../../../config/prisma';
import { AuthError } from '../auth.errors';
import { RegisterDto } from '../schemas/register.schemas';
import { issueEmailVerificationToken } from './email-auth.service';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class registerService {
  static async register(data: RegisterDto) {
    const email = normalizeEmail(data.email);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new AuthError('USER_ALREADY_EXISTS', 'Пользователь с таким email уже существует', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        ...(data.name ? { name: data.name.trim() } : {}),
        notificationSettings: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    await issueEmailVerificationToken(user.id, user.email);
    return user;
  }
}

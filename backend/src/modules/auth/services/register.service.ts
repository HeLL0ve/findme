import bcrypt from 'bcrypt';
import { prisma } from '../../../config/prisma';
import { AuthError } from '../auth.errors';
import { RegisterDto } from '../schemas/register.schemas';

export class registerService {
  static async register(data: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });

    if (existing) {
      throw new AuthError('USER_ALREADY_EXISTS', 'Пользователь с таким email уже существует', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
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

    return user;
  }
}

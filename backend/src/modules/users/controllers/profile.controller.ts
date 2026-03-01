import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';

const BELARUS_PHONE_REGEX = /^\+375(25|29|33|44)\d{7}$/;

function normalizePhone(phone: string) {
  return phone.replace(/[\s()-]/g, '');
}

function mapProfileSelect() {
  return {
    id: true,
    email: true,
    name: true,
    phone: true,
    telegramUsername: true,
    avatarUrl: true,
    role: true,
    isBlocked: true,
    notificationSettings: { select: { notifyWeb: true, notifyTelegram: true } },
  } as const;
}

export async function getProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const [user, summaryRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: mapProfileSelect(),
      }),
      prisma.$queryRaw<
        Array<{ total: number; pending: number; approved: number; rejected: number; archived: number }>
      >`SELECT * FROM fn_user_ads_summary(${userId})`,
    ]);

    if (!user) return next(ApiError.notFound('Пользователь не найден'));

    const summary = summaryRows[0] ?? { total: 0, pending: 0, approved: 0, rejected: 0, archived: 0 };
    return res.json({
      ...user,
      adsSummary: summary,
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { name, phone, telegramUsername, notifyWeb, notifyTelegram } = req.body as {
      name?: string;
      phone?: string;
      telegramUsername?: string;
      notifyWeb?: boolean;
      notifyTelegram?: boolean;
    };
    const normalizedName = name !== undefined ? String(name).trim() : undefined;
    const normalizedTelegramUsername = telegramUsername !== undefined ? String(telegramUsername).trim() : undefined;

    let nextPhone: string | null | undefined;
    if (phone !== undefined) {
      const normalized = normalizePhone(String(phone).trim());
      if (!normalized) {
        nextPhone = null;
      } else if (!BELARUS_PHONE_REGEX.test(normalized)) {
        return next(
          ApiError.validation(
            { phone: 'Используйте формат +375XXXXXXXXX и мобильные коды Беларуси: 25, 29, 33, 44' },
            'Некорректный номер телефона',
          ),
        );
      } else {
        nextPhone = normalized;
      }
    }

    await prisma.$transaction(async (tx) => {
      if (name !== undefined || nextPhone !== undefined || telegramUsername !== undefined) {
        await tx.$executeRaw`
          CALL sp_update_user_profile(
            ${userId},
            ${normalizedName ?? null},
            ${nextPhone ?? null},
            ${normalizedTelegramUsername ?? null},
            ${name !== undefined},
            ${nextPhone !== undefined},
            ${telegramUsername !== undefined}
          )
        `;
      }

      if (notifyWeb !== undefined || notifyTelegram !== undefined) {
        await tx.notificationSettings.upsert({
          where: { userId },
          create: {
            userId,
            notifyWeb: notifyWeb ?? true,
            notifyTelegram: notifyTelegram ?? false,
          },
          update: {
            ...(notifyWeb !== undefined ? { notifyWeb: !!notifyWeb } : {}),
            ...(notifyTelegram !== undefined ? { notifyTelegram: !!notifyTelegram } : {}),
          },
        });
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: mapProfileSelect(),
    });

    if (!user) return next(ApiError.notFound('Пользователь не найден'));

    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

export async function changePasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return next(ApiError.validation({ currentPassword: 'required', newPassword: 'required' }));
    }
    if (newPassword.length < 6) {
      return next(ApiError.validation({ newPassword: 'Пароль должен быть не менее 6 символов' }));
    }
    if (newPassword === currentPassword) {
      return next(ApiError.validation({ newPassword: 'Новый пароль должен отличаться от текущего' }));
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user) return next(ApiError.notFound('Пользователь не найден'));

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return next(new ApiError('INVALID_CREDENTIALS', 'Текущий пароль указан неверно', 401));
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

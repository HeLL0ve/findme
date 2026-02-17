import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';

export async function blockUserController(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { block } = req.body as { block?: boolean };

    if (typeof block !== 'boolean') {
      return next(ApiError.validation({ block: 'Поле block должно быть boolean' }));
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked: block },
    });

    return res.json({ id: user.id, isBlocked: user.isBlocked });
  } catch (err) {
    return next(err);
  }
}

export async function changeRoleController(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: 'USER' | 'ADMIN' };

    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return next(ApiError.validation({ role: 'Неверная роль' }));
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return res.json({ id: user.id, role: user.role });
  } catch (err) {
    return next(err);
  }
}

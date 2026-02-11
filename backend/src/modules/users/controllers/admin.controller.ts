import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/prisma';
import { ApiError } from '../../../shared/errors/apiError';

export async function blockUserController(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const { block } = req.body as { block: boolean };
    if (typeof block !== 'boolean') return next(ApiError.validation('Поле block должно быть boolean'));

    const user = await prisma.user.update({ where: { id }, data: { isBlocked: !!block } });

    return res.json({ id: user.id, isBlocked: user.isBlocked });
  } catch (err) {
    return next(err);
  }
}

export async function changeRoleController(req: Request<{ id: string }>, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const { role } = req.body as { role: 'USER' | 'ADMIN' };

    if (!['USER', 'ADMIN'].includes(role)) return next(ApiError.validation('Неверная роль'));

    const user = await prisma.user.update({ where: { id }, data: { role } });

    return res.json({ id: user.id, role: user.role });
  } catch (err) {
    return next(err);
  }
}

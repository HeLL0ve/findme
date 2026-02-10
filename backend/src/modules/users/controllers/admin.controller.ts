import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/prisma';
import { AuthError } from '../../auth/auth.errors';

export async function blockUserController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const { block } = req.body as { block: boolean };

    const user = await prisma.user.update({ where: { id }, data: { isBlocked: !!block } });

    return res.json({ id: user.id, isBlocked: user.isBlocked });
  } catch (err) {
    return next(err);
  }
}

export async function changeRoleController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const { role } = req.body as { role: 'USER' | 'ADMIN' };

    if (!['USER', 'ADMIN'].includes(role)) return next(new AuthError('INVALID_ROLE', 'Неверная роль', 400));

    const user = await prisma.user.update({ where: { id }, data: { role } });

    return res.json({ id: user.id, role: user.role });
  } catch (err) {
    return next(err);
  }
}

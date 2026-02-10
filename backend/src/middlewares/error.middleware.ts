import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../modules/auth/auth.errors';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AuthError) {
    return res.status(err.status || 400).json({ code: err.code, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' });
}

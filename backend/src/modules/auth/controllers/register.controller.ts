import { Request, Response, NextFunction } from 'express';
import { registerSchema } from '../schemas/register.schemas';
import { registerService } from '../services/register.service';
import { ApiError } from '../../../shared/errors/apiError';

export async function registerController(req: Request, res: Response, next: NextFunction) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(ApiError.validation(parsed.error.flatten()));
  }

  try {
    const user = await registerService.register(parsed.data);

    return res.status(201).json(user);
  } catch (err) {
    return next(err);
  }
}

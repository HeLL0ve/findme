import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../shared/errors/apiError';
import { createTelegramLinkToken, getTelegramLinkStatus, unlinkTelegram } from './telegram.service';

export async function telegramLinkController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return next(ApiError.unauthorized());

    const data = await createTelegramLinkToken(userId);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function telegramStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return next(ApiError.unauthorized());

    const data = await getTelegramLinkStatus(userId);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function telegramUnlinkController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return next(ApiError.unauthorized());

    await unlinkTelegram(userId);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

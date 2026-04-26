import { Request, Response } from 'express';
import { env } from '../../config/env';

export const healthCheck = (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
};

export const getPublicConfig = (_req: Request, res: Response) => {
  res.json({
    telegramChannelUrl: env.telegramChannelUrl,
    appUrl: env.appUrl,
  });
};

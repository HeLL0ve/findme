import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../../shared/errors/apiError';
import {
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../schemas/email-auth.schemas';
import {
  issuePasswordReset,
  resendEmailVerification,
  resetPasswordByToken,
  verifyEmailByToken,
} from '../services/email-auth.service';

export async function verifyEmailController(req: Request, res: Response, next: NextFunction) {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) return next(ApiError.validation(parsed.error.flatten()));

  try {
    await verifyEmailByToken(parsed.data.token);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

export async function resendVerificationController(req: Request, res: Response, next: NextFunction) {
  const parsed = resendVerificationSchema.safeParse(req.body);
  if (!parsed.success) return next(ApiError.validation(parsed.error.flatten()));

  try {
    await resendEmailVerification(parsed.data.email);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return next(ApiError.validation(parsed.error.flatten()));

  try {
    await issuePasswordReset(parsed.data.email);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return next(ApiError.validation(parsed.error.flatten()));

  try {
    await resetPasswordByToken(parsed.data.token, parsed.data.newPassword);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

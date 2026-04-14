import { z } from 'zod';

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(20, 'Токен подтверждения обязателен'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Некорректный email'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Некорректный email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20, 'Токен обязателен'),
  newPassword: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
});

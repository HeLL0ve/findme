import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().trim().min(2, 'Имя слишком короткое').max(80, 'Имя слишком длинное').optional(),
  acceptTerms: z.literal(true).refine((value) => value === true, {
    message: 'Необходимо принять пользовательское соглашение',
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>;

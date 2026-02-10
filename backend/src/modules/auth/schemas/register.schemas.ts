import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().min(2).optional(),
  acceptTerms: z.literal(true).refine((val) => val === true, {
    message: 'Необходимо принять пользовательское соглашение',
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>;
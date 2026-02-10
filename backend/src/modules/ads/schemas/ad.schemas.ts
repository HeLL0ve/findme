import { z } from 'zod';

export const createAdSchema = z.object({
  type: z.enum(['LOST', 'FOUND']),
  petName: z.string().max(100).optional(),
  animalType: z.string().max(100).optional(),
  breed: z.string().max(100).optional(),
  color: z.string().max(100).optional(),
  description: z.string().min(10, 'Описание слишком короткое (минимум 10 символов)'),
  location: z
    .object({ address: z.string().optional(), latitude: z.number().optional(), longitude: z.number().optional(), city: z.string().optional() })
    .optional(),
  photos: z.array(z.string().url()).optional(),
});

export type CreateAdDto = z.infer<typeof createAdSchema>;

import { z } from 'zod';

export const createAdSchema = z.object({
  type: z.enum(['LOST', 'FOUND']),
  petName: z.string().trim().max(100, 'Кличка слишком длинная').optional(),
  animalType: z.string().trim().max(100, 'Слишком длинное значение').optional(),
  breed: z.string().trim().max(100, 'Слишком длинное значение').optional(),
  color: z.string().trim().max(100, 'Слишком длинное значение').optional(),
  description: z.string().trim().min(10, 'Описание слишком короткое (минимум 10 символов)').max(4000, 'Описание слишком длинное'),
  location: z
    .object({
      address: z.string().trim().max(255, 'Слишком длинный адрес').optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      city: z.string().trim().max(100, 'Слишком длинное название города').optional(),
    })
    .optional(),
  photos: z.array(z.string().url()).max(8, 'Можно добавить не более 8 фото').optional(),
});

export type CreateAdDto = z.infer<typeof createAdSchema>;

export const updateAdSchema = createAdSchema.partial().extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED']).optional(),
});

export type UpdateAdDto = z.infer<typeof updateAdSchema>;

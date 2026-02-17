import { z } from 'zod';

export const createComplaintSchema = z.object({
  targetType: z.enum(['AD', 'USER']),
  targetId: z.string().min(1, 'targetId обязателен'),
  reason: z.string().trim().min(5, 'Опишите причину подробнее').max(300, 'Причина слишком длинная'),
  description: z.string().trim().max(2000, 'Описание слишком длинное').optional(),
});

export const reviewComplaintSchema = z.object({
  status: z.enum(['RESOLVED', 'REJECTED']),
  reviewComment: z.string().trim().max(2000, 'Комментарий слишком длинный').optional(),
});

export type CreateComplaintDto = z.infer<typeof createComplaintSchema>;
export type ReviewComplaintDto = z.infer<typeof reviewComplaintSchema>;

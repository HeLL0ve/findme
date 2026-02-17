import { z } from 'zod';

export const createComplaintSchema = z
  .object({
    kind: z.enum(['REPORT', 'SUPPORT']).default('REPORT'),
    targetType: z.enum(['AD', 'USER', 'NONE']).optional(),
    targetId: z.string().min(1, 'targetId обязателен').optional(),
    reason: z.string().trim().min(5, 'Опишите причину подробнее').max(300, 'Причина слишком длинная'),
    description: z.string().trim().max(2000, 'Описание слишком длинное').optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'REPORT') {
      if (!value.targetType || value.targetType === 'NONE') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'targetType обязателен для жалобы',
          path: ['targetType'],
        });
      }
      if (!value.targetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'targetId обязателен для жалобы',
          path: ['targetId'],
        });
      }
    }

    if (value.kind === 'SUPPORT') {
      if (!value.description || value.description.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Для обращения в поддержку добавьте описание не менее 10 символов',
          path: ['description'],
        });
      }
    }
  });

export const reviewComplaintSchema = z.object({
  status: z.enum(['RESOLVED', 'REJECTED']),
  reviewComment: z.string().trim().max(2000, 'Комментарий слишком длинный').optional(),
});

export type CreateComplaintDto = z.infer<typeof createComplaintSchema>;
export type ReviewComplaintDto = z.infer<typeof reviewComplaintSchema>;

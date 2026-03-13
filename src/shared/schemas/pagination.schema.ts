import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1, { error: 'Page must be >= 1' }).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, { error: 'Limit must be >= 1' })
    .max(100, { error: 'Limit must be <= 100' })
    .optional(),
});

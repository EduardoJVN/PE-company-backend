import { z } from 'zod';

export const GetProductParamsSchema = z.object({
  id: z.string().uuid({ message: 'Product ID must be a valid UUID' }),
});

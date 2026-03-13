import { z } from 'zod';

export const UpdateProductSchema = z
  .object({
    name: z.string().min(1, { error: 'Name is required' }).optional(),
    sku: z.string().min(1, { error: 'SKU is required' }).optional(),
    categoryId: z
      .number()
      .int()
      .positive({ error: 'Category ID must be a positive integer' })
      .optional(),
    price: z.number().min(0, { error: 'Price must be >= 0' }).optional(),
    stockMinimum: z.number().int().min(0, { error: 'Stock minimum must be >= 0' }).optional(),
    description: z.string().nullable().optional(),
    specs: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateProductBody = z.infer<typeof UpdateProductSchema>;

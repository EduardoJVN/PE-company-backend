import { z } from 'zod';

export const CreateProductSchema = z
  .object({
    name: z.string().min(1, { error: 'Name is required' }),
    sku: z.string().min(1, { error: 'SKU is required' }),
    categoryId: z.number().int().positive({ error: 'Category ID must be a positive integer' }),
    price: z.number().min(0, { error: 'Price must be >= 0' }),
    stockCurrent: z.number().int().min(0, { error: 'Stock current must be >= 0' }),
    stockMinimum: z.number().int().min(0, { error: 'Stock minimum must be >= 0' }),
    description: z.string().optional(),
    specs: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((d) => d.stockCurrent >= d.stockMinimum, {
    message: 'Stock current cannot be less than stock minimum',
    path: ['stockCurrent'],
  });

export type CreateProductBody = z.infer<typeof CreateProductSchema>;

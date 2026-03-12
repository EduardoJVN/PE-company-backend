import { z } from 'zod';

export const updateCompanyBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
});

export type UpdateCompanyBody = z.infer<typeof updateCompanyBodySchema>;

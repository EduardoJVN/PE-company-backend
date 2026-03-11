import { z } from 'zod';

export const createCompanyBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  sectorIds: z.array(z.number().int().positive()).optional(),
});

export type CreateCompanyBody = z.infer<typeof createCompanyBodySchema>;

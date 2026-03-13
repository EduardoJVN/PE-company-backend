import { z } from 'zod';
import { PaginationSchema } from '@shared/schemas/pagination.schema.js';

export const ListProductsSchema = PaginationSchema.extend({
  isActive: z
    .preprocess(
      (val) =>
        val === 'true' || val === '1' ? true : val === 'false' || val === '0' ? false : val,
      z.boolean(),
    )
    .default(true),
  name: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  maxStock: z.coerce.number().int().min(0).optional(),
}).passthrough(); // permite specs[ram]=16GB como claves extra

export type ListProductsQuery = z.infer<typeof ListProductsSchema>;

/**
 * Extrae los filtros de specs del query parseado.
 * Las claves que no son campos conocidos y tienen formato specs[key] son specs.
 * Ej: { "specs[ram]": "16GB", "specs[color]": "Azul" } → { ram: "16GB", color: "Azul" }
 */
export function extractSpecsFilter(raw: Record<string, unknown>): Record<string, string> {
  const specs: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const match = key.match(/^specs\[(.+)\]$/);
    if (match?.[1] && typeof value === 'string') {
      specs[match[1]] = value;
    }
  }
  return specs;
}

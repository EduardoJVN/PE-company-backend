import { describe, it, expect } from 'vitest';
import { createCompanyBodySchema } from '@infra/companies/entry-points/schemas/create-company.schema.js';

describe('createCompanyBodySchema', () => {
  it('accepts minimal valid input', () => {
    const result = createCompanyBodySchema.safeParse({ name: 'Acme Corp' });
    expect(result.success).toBe(true);
  });

  it('accepts full valid input', () => {
    const result = createCompanyBodySchema.safeParse({
      name: 'Acme Corp',
      description: 'Una empresa de tecnología',
      logoUrl: 'https://example.com/logo.png',
      sectorIds: [1, 2, 3],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = createCompanyBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createCompanyBodySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 255 chars', () => {
    const result = createCompanyBodySchema.safeParse({ name: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid logoUrl', () => {
    const result = createCompanyBodySchema.safeParse({ name: 'Acme', logoUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects sectorIds with non-integer values', () => {
    const result = createCompanyBodySchema.safeParse({ name: 'Acme', sectorIds: [1.5] });
    expect(result.success).toBe(false);
  });

  it('rejects sectorIds with zero or negative values', () => {
    const result = createCompanyBodySchema.safeParse({ name: 'Acme', sectorIds: [0] });
    expect(result.success).toBe(false);
  });
});

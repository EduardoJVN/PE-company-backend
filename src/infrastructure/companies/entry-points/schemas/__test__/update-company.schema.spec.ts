import { describe, it, expect } from 'vitest';
import { updateCompanyBodySchema } from '@infra/companies/entry-points/schemas/update-company.schema.js';

describe('updateCompanyBodySchema', () => {
  it('accepts minimal valid input (name only)', () => {
    const result = updateCompanyBodySchema.safeParse({ name: 'Acme Corp' });
    expect(result.success).toBe(true);
  });

  it('accepts full valid input', () => {
    const result = updateCompanyBodySchema.safeParse({
      name: 'Acme Corp',
      description: 'Una empresa de tecnología',
      logoUrl: 'https://example.com/logo.png',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null description to clear the field', () => {
    const result = updateCompanyBodySchema.safeParse({ name: 'Acme', description: null });
    expect(result.success).toBe(true);
  });

  it('accepts null logoUrl to clear the field', () => {
    const result = updateCompanyBodySchema.safeParse({ name: 'Acme', logoUrl: null });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = updateCompanyBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = updateCompanyBodySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 255 chars', () => {
    const result = updateCompanyBodySchema.safeParse({ name: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid logoUrl', () => {
    const result = updateCompanyBodySchema.safeParse({ name: 'Acme', logoUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

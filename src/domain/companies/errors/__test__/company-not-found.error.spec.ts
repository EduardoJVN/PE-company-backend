import { describe, it, expect } from 'vitest';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { NotFoundError } from '@shared/errors/not-found.error.js';

describe('CompanyNotFoundError', () => {
  it('extends NotFoundError', () => {
    expect(new CompanyNotFoundError('x')).toBeInstanceOf(NotFoundError);
  });

  it('includes the id in the message', () => {
    const error = new CompanyNotFoundError('company-uuid');
    expect(error.message).toContain('company-uuid');
  });

  it('has the correct name', () => {
    expect(new CompanyNotFoundError('x').name).toBe('CompanyNotFoundError');
  });
});

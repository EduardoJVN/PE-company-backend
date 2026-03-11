import { describe, it, expect } from 'vitest';
import { CompanyMemberNotFoundError } from '@domain/companies/errors/company-member-not-found.error.js';
import { NotFoundError } from '@shared/errors/not-found.error.js';

describe('CompanyMemberNotFoundError', () => {
  it('is an instance of NotFoundError', () => {
    const error = new CompanyMemberNotFoundError('user-uuid');

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('has the correct name', () => {
    const error = new CompanyMemberNotFoundError('user-uuid');

    expect(error.name).toBe('CompanyMemberNotFoundError');
  });

  it('includes the userId in the message', () => {
    const error = new CompanyMemberNotFoundError('user-uuid');

    expect(error.message).toContain('user-uuid');
  });
});

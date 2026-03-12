import { describe, it, expect } from 'vitest';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import { ForbiddenError } from '@shared/errors/forbidden.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('UnauthorizedCompanyAccessError', () => {
  it('is an instance of ForbiddenError', () => {
    const error = new UnauthorizedCompanyAccessError('company-uuid');

    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('is an instance of DomainError', () => {
    const error = new UnauthorizedCompanyAccessError('company-uuid');

    expect(error).toBeInstanceOf(DomainError);
  });

  it('includes the company id in the message', () => {
    const error = new UnauthorizedCompanyAccessError('company-uuid');

    expect(error.message).toContain('company-uuid');
  });

  it('has the correct name', () => {
    const error = new UnauthorizedCompanyAccessError('company-uuid');

    expect(error.name).toBe('UnauthorizedCompanyAccessError');
  });
});

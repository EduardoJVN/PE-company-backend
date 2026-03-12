import { describe, it, expect } from 'vitest';
import { MemberAlreadyInCompanyError } from '@domain/companies/errors/member-already-in-company.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('MemberAlreadyInCompanyError', () => {
  it('is an instance of DomainError', () => {
    const error = new MemberAlreadyInCompanyError('user@example.com');

    expect(error).toBeInstanceOf(DomainError);
  });

  it('has the correct name', () => {
    const error = new MemberAlreadyInCompanyError('user@example.com');

    expect(error.name).toBe('MemberAlreadyInCompanyError');
  });

  it('includes the email in the message', () => {
    const error = new MemberAlreadyInCompanyError('user@example.com');

    expect(error.message).toContain('user@example.com');
  });
});

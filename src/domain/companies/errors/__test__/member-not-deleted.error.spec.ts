import { describe, it, expect } from 'vitest';
import { MemberNotDeletedError } from '@domain/companies/errors/member-not-deleted.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('MemberNotDeletedError', () => {
  it('is an instance of DomainError', () => {
    const error = new MemberNotDeletedError('user-uuid');

    expect(error).toBeInstanceOf(DomainError);
  });

  it('has the correct name', () => {
    const error = new MemberNotDeletedError('user-uuid');

    expect(error.name).toBe('MemberNotDeletedError');
  });

  it('includes the userId in the message', () => {
    const error = new MemberNotDeletedError('user-uuid');

    expect(error.message).toContain('user-uuid');
  });
});

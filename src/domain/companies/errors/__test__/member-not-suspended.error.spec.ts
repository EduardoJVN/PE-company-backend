import { describe, it, expect } from 'vitest';
import { MemberNotSuspendedError } from '@domain/companies/errors/member-not-suspended.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('MemberNotSuspendedError', () => {
  it('is an instance of DomainError', () => {
    const error = new MemberNotSuspendedError('user-uuid');

    expect(error).toBeInstanceOf(DomainError);
  });

  it('has the correct name', () => {
    const error = new MemberNotSuspendedError('user-uuid');

    expect(error.name).toBe('MemberNotSuspendedError');
  });

  it('includes the userId in the message', () => {
    const error = new MemberNotSuspendedError('user-uuid');

    expect(error.message).toContain('user-uuid');
  });
});

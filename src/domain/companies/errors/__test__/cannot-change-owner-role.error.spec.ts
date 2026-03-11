import { describe, it, expect } from 'vitest';
import { CannotChangeOwnerRoleError } from '@domain/companies/errors/cannot-change-owner-role.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('CannotChangeOwnerRoleError', () => {
  it('is an instance of DomainError', () => {
    const error = new CannotChangeOwnerRoleError();

    expect(error).toBeInstanceOf(DomainError);
  });

  it('has the correct name', () => {
    const error = new CannotChangeOwnerRoleError();

    expect(error.name).toBe('CannotChangeOwnerRoleError');
  });

  it('has a descriptive message', () => {
    const error = new CannotChangeOwnerRoleError();

    expect(error.message).toBeTruthy();
  });
});

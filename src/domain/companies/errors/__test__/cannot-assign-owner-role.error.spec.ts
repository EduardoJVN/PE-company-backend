import { describe, it, expect } from 'vitest';
import { CannotAssignOwnerRoleError } from '@domain/companies/errors/cannot-assign-owner-role.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('CannotAssignOwnerRoleError', () => {
  it('is an instance of DomainError', () => {
    const error = new CannotAssignOwnerRoleError();

    expect(error).toBeInstanceOf(DomainError);
  });

  it('has the correct name', () => {
    const error = new CannotAssignOwnerRoleError();

    expect(error.name).toBe('CannotAssignOwnerRoleError');
  });

  it('has a descriptive message', () => {
    const error = new CannotAssignOwnerRoleError();

    expect(error.message).toBeTruthy();
  });
});

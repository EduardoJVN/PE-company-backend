import { describe, it, expect } from 'vitest';
import { CannotSuspendOwnerError } from '@domain/companies/errors/cannot-suspend-owner.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('CannotSuspendOwnerError', () => {
  it('is an instance of DomainError', () => {
    const error = new CannotSuspendOwnerError();

    expect(error).toBeInstanceOf(DomainError);
  });

  it('has the correct name', () => {
    const error = new CannotSuspendOwnerError();

    expect(error.name).toBe('CannotSuspendOwnerError');
  });

  it('has a descriptive message', () => {
    const error = new CannotSuspendOwnerError();

    expect(error.message).toBeTruthy();
  });
});

import { describe, it, expect } from 'vitest';
import { CannotRemoveOwnerError } from '@domain/companies/errors/cannot-remove-owner.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('CannotRemoveOwnerError', () => {
  it('is an instance of DomainError', () => {
    const error = new CannotRemoveOwnerError();

    expect(error).toBeInstanceOf(DomainError);
  });

  it('has the correct name', () => {
    const error = new CannotRemoveOwnerError();

    expect(error.name).toBe('CannotRemoveOwnerError');
  });

  it('has a descriptive message', () => {
    const error = new CannotRemoveOwnerError();

    expect(error.message).toBeTruthy();
  });
});

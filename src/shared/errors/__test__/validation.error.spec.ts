import { describe, it, expect } from 'vitest';
import { ValidationError } from '@shared/errors/validation.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('ValidationError', () => {
  it('is an instance of DomainError', () => {
    const error = new ValidationError('invalid input');
    expect(error).toBeInstanceOf(DomainError);
  });

  it('sets message correctly', () => {
    const error = new ValidationError('name is required');
    expect(error.message).toBe('name is required');
  });

  it('sets name to class name', () => {
    const error = new ValidationError('test');
    expect(error.name).toBe('ValidationError');
  });
});

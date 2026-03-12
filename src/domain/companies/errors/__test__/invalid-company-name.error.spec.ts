import { describe, it, expect } from 'vitest';
import { InvalidCompanyNameError } from '@domain/companies/errors/invalid-company-name.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('InvalidCompanyNameError', () => {
  it('extends DomainError', () => {
    expect(new InvalidCompanyNameError()).toBeInstanceOf(DomainError);
  });

  it('has the correct name', () => {
    expect(new InvalidCompanyNameError().name).toBe('InvalidCompanyNameError');
  });

  it('has a descriptive message', () => {
    expect(new InvalidCompanyNameError().message).toBeTruthy();
  });
});

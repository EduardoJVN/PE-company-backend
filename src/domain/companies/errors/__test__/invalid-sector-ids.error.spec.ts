import { describe, it, expect } from 'vitest';
import { InvalidSectorIdsError } from '@domain/companies/errors/invalid-sector-ids.error.js';
import { DomainError } from '@shared/errors/domain.error.js';

describe('InvalidSectorIdsError', () => {
  it('extends DomainError', () => {
    expect(new InvalidSectorIdsError()).toBeInstanceOf(DomainError);
  });

  it('has the correct name', () => {
    expect(new InvalidSectorIdsError().name).toBe('InvalidSectorIdsError');
  });

  it('has a descriptive message', () => {
    expect(new InvalidSectorIdsError().message).toBeTruthy();
  });
});

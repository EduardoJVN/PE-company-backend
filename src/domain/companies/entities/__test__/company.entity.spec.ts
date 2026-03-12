import { describe, it, expect } from 'vitest';
import { Company } from '@domain/companies/entities/company.entity.js';
import { InvalidCompanyNameError } from '@domain/companies/errors/invalid-company-name.error.js';
import { InvalidSectorIdsError } from '@domain/companies/errors/invalid-sector-ids.error.js';
import { CompanyStatusId } from '@domain/catalog-ids.js';

describe('Company.create', () => {
  it('creates a company with valid input', () => {
    const company = Company.create('id', 'owner-id', 'Acme Corp', [1]);

    expect(company.id).toBe('id');
    expect(company.ownerId).toBe('owner-id');
    expect(company.name).toBe('Acme Corp');
    expect(company.sectorIds).toEqual([1]);
  });

  it('sets statusId to ACTIVE', () => {
    const company = Company.create('id', 'owner-id', 'Acme Corp', [1]);

    expect(company.statusId).toBe(CompanyStatusId.ACTIVE);
  });

  it('sets isActive to true and isVerified to false', () => {
    const company = Company.create('id', 'owner-id', 'Acme Corp', [1]);

    expect(company.isActive).toBe(true);
    expect(company.isVerified).toBe(false);
  });

  it('sets verifiedAt and verifiedBy to null', () => {
    const company = Company.create('id', 'owner-id', 'Acme Corp', [1]);

    expect(company.verifiedAt).toBeNull();
    expect(company.verifiedBy).toBeNull();
  });

  it('sets deletedAt to null', () => {
    const company = Company.create('id', 'owner-id', 'Acme Corp', [1]);

    expect(company.deletedAt).toBeNull();
  });

  it('sets createdAt and updatedAt to now', () => {
    const before = new Date();
    const company = Company.create('id', 'owner-id', 'Acme Corp', [1]);
    const after = new Date();

    expect(company.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(company.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(company.updatedAt).toEqual(company.createdAt);
  });

  it('sets optional description and logoUrl', () => {
    const company = Company.create(
      'id',
      'owner-id',
      'Acme Corp',
      [1],
      'Una empresa',
      'https://example.com/logo.png',
    );

    expect(company.description).toBe('Una empresa');
    expect(company.logoUrl).toBe('https://example.com/logo.png');
  });

  it('sets description and logoUrl to null when not provided', () => {
    const company = Company.create('id', 'owner-id', 'Acme Corp', [1]);

    expect(company.description).toBeNull();
    expect(company.logoUrl).toBeNull();
  });

  it('throws InvalidCompanyNameError when name is empty', () => {
    expect(() => Company.create('id', 'owner-id', '', [1])).toThrow(InvalidCompanyNameError);
  });

  it('throws InvalidCompanyNameError when name is only whitespace', () => {
    expect(() => Company.create('id', 'owner-id', '   ', [1])).toThrow(InvalidCompanyNameError);
  });

  it('throws InvalidSectorIdsError when sectorIds is empty', () => {
    expect(() => Company.create('id', 'owner-id', 'Acme Corp', [])).toThrow(InvalidSectorIdsError);
  });
});

describe('Company.update', () => {
  const base = Company.create(
    'id',
    'owner-id',
    'Acme Corp',
    [1],
    'Original desc',
    'https://logo.png',
  );

  it('returns a new Company instance with updated name', () => {
    const updated = base.update('New Name');

    expect(updated).not.toBe(base);
    expect(updated.name).toBe('New Name');
  });

  it('preserves unchanged fields', () => {
    const updated = base.update('New Name');

    expect(updated.id).toBe(base.id);
    expect(updated.ownerId).toBe(base.ownerId);
    expect(updated.statusId).toBe(base.statusId);
    expect(updated.sectorIds).toEqual(base.sectorIds);
    expect(updated.isActive).toBe(base.isActive);
    expect(updated.isVerified).toBe(base.isVerified);
    expect(updated.createdAt).toEqual(base.createdAt);
  });

  it('updates description when provided', () => {
    const updated = base.update('Acme Corp', 'New desc');

    expect(updated.description).toBe('New desc');
  });

  it('updates logoUrl when provided', () => {
    const updated = base.update('Acme Corp', undefined, 'https://new-logo.png');

    expect(updated.logoUrl).toBe('https://new-logo.png');
  });

  it('sets description to null when explicitly passed null', () => {
    const updated = base.update('Acme Corp', null);

    expect(updated.description).toBeNull();
  });

  it('preserves existing description when not provided', () => {
    const updated = base.update('New Name');

    expect(updated.description).toBe(base.description);
  });

  it('sets updatedAt to a new date', () => {
    const before = new Date();
    const updated = base.update('New Name');
    const after = new Date();

    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('throws InvalidCompanyNameError when new name is empty', () => {
    expect(() => base.update('')).toThrow(InvalidCompanyNameError);
  });

  it('throws InvalidCompanyNameError when new name is only whitespace', () => {
    expect(() => base.update('   ')).toThrow(InvalidCompanyNameError);
  });
});

describe('Company.reconstitute', () => {
  it('reconstitutes a company without validation', () => {
    const createdAt = new Date('2026-01-01');
    const updatedAt = new Date('2026-01-02');

    const company = Company.reconstitute(
      'id',
      'owner-id',
      'Acme Corp',
      'Desc',
      null,
      CompanyStatusId.VERIFIED,
      [1, 2],
      true,
      true,
      new Date('2026-01-01'),
      'admin-id',
      createdAt,
      updatedAt,
      null,
    );

    expect(company.id).toBe('id');
    expect(company.statusId).toBe(CompanyStatusId.VERIFIED);
    expect(company.isVerified).toBe(true);
    expect(company.verifiedBy).toBe('admin-id');
    expect(company.createdAt).toEqual(createdAt);
    expect(company.updatedAt).toEqual(updatedAt);
  });

  it('does not throw when name is empty (no validation on reconstitute)', () => {
    expect(() =>
      Company.reconstitute(
        'id',
        'owner',
        '',
        null,
        null,
        1,
        [],
        true,
        false,
        null,
        null,
        new Date(),
        new Date(),
        null,
      ),
    ).not.toThrow();
  });
});

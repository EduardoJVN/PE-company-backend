import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryCompanyMembershipCache } from '@infra/companies/adapters/in-memory-company-membership.cache.js';
import { CompanyMemberRoleId } from '@domain/catalog-ids.js';

describe('InMemoryCompanyMembershipCache', () => {
  let cache: InMemoryCompanyMembershipCache;

  beforeEach(() => {
    cache = new InMemoryCompanyMembershipCache();
  });

  it('returns null when entry does not exist', async () => {
    const result = await cache.get('company-1', 'user-1');
    expect(result).toBeNull();
  });

  it('returns the cached roleId after set', async () => {
    await cache.set('company-1', 'user-1', CompanyMemberRoleId.ADMIN, 60_000);

    const result = await cache.get('company-1', 'user-1');

    expect(result).toEqual({ roleId: CompanyMemberRoleId.ADMIN });
  });

  it('isolates entries by companyId + userId key', async () => {
    await cache.set('company-1', 'user-1', CompanyMemberRoleId.OWNER, 60_000);
    await cache.set('company-1', 'user-2', CompanyMemberRoleId.EDITOR, 60_000);
    await cache.set('company-2', 'user-1', CompanyMemberRoleId.VIEWER, 60_000);

    expect(await cache.get('company-1', 'user-1')).toEqual({ roleId: CompanyMemberRoleId.OWNER });
    expect(await cache.get('company-1', 'user-2')).toEqual({ roleId: CompanyMemberRoleId.EDITOR });
    expect(await cache.get('company-2', 'user-1')).toEqual({ roleId: CompanyMemberRoleId.VIEWER });
  });

  it('returns null after TTL expires', async () => {
    vi.useFakeTimers();

    await cache.set('company-1', 'user-1', CompanyMemberRoleId.ADMIN, 5_000);

    vi.advanceTimersByTime(5_001);

    const result = await cache.get('company-1', 'user-1');
    expect(result).toBeNull();

    vi.useRealTimers();
  });

  it('returns entry before TTL expires', async () => {
    vi.useFakeTimers();

    await cache.set('company-1', 'user-1', CompanyMemberRoleId.ADMIN, 5_000);

    vi.advanceTimersByTime(4_999);

    const result = await cache.get('company-1', 'user-1');
    expect(result).toEqual({ roleId: CompanyMemberRoleId.ADMIN });

    vi.useRealTimers();
  });

  it('removes entry on delete', async () => {
    await cache.set('company-1', 'user-1', CompanyMemberRoleId.OWNER, 60_000);

    await cache.delete('company-1', 'user-1');

    const result = await cache.get('company-1', 'user-1');
    expect(result).toBeNull();
  });

  it('delete is a no-op for non-existent entries', async () => {
    await expect(cache.delete('company-x', 'user-x')).resolves.toBeUndefined();
  });
});

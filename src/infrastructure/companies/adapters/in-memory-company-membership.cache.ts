import type { CompanyMemberRoleId } from '@domain/catalog-ids.js';
import type {
  CachedMembership,
  ICompanyMembershipCache,
} from '@domain/companies/ports/company-membership-cache.port.js';

interface CacheEntry {
  roleId: CompanyMemberRoleId;
  expiresAt: number;
}

export class InMemoryCompanyMembershipCache implements ICompanyMembershipCache {
  private readonly store = new Map<string, CacheEntry>();

  private key(companyId: string, userId: string): string {
    return `${companyId}:${userId}`;
  }

  async get(companyId: string, userId: string): Promise<CachedMembership | null> {
    const entry = this.store.get(this.key(companyId, userId));

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.key(companyId, userId));
      return null;
    }

    return { roleId: entry.roleId };
  }

  async set(
    companyId: string,
    userId: string,
    roleId: CompanyMemberRoleId,
    ttlMs: number,
  ): Promise<void> {
    this.store.set(this.key(companyId, userId), {
      roleId,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async delete(companyId: string, userId: string): Promise<void> {
    this.store.delete(this.key(companyId, userId));
  }
}

import type { CompanyMemberRoleId } from '@domain/catalog-ids.js';

export interface CachedMembership {
  roleId: CompanyMemberRoleId;
}

export interface ICompanyMembershipCache {
  get(companyId: string, userId: string): Promise<CachedMembership | null>;
  set(companyId: string, userId: string, roleId: CompanyMemberRoleId, ttlMs: number): Promise<void>;
  delete(companyId: string, userId: string): Promise<void>;
}

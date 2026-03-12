import { describe, it, expect } from 'vitest';
import { changeMemberRoleBodySchema } from '@infra/companies/entry-points/schemas/change-member-role.schema.js';
import { CompanyMemberRoleId } from '@domain/catalog-ids.js';

describe('changeMemberRoleBodySchema', () => {
  it('accepts ADMIN roleId', () => {
    const result = changeMemberRoleBodySchema.safeParse({ roleId: CompanyMemberRoleId.ADMIN });
    expect(result.success).toBe(true);
  });

  it('accepts EDITOR roleId', () => {
    const result = changeMemberRoleBodySchema.safeParse({ roleId: CompanyMemberRoleId.EDITOR });
    expect(result.success).toBe(true);
  });

  it('accepts VIEWER roleId', () => {
    const result = changeMemberRoleBodySchema.safeParse({ roleId: CompanyMemberRoleId.VIEWER });
    expect(result.success).toBe(true);
  });

  it('rejects OWNER roleId', () => {
    const result = changeMemberRoleBodySchema.safeParse({ roleId: CompanyMemberRoleId.OWNER });
    expect(result.success).toBe(false);
  });

  it('rejects missing roleId', () => {
    const result = changeMemberRoleBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-integer roleId', () => {
    const result = changeMemberRoleBodySchema.safeParse({ roleId: 2.5 });
    expect(result.success).toBe(false);
  });

  it('rejects string roleId', () => {
    const result = changeMemberRoleBodySchema.safeParse({ roleId: 'admin' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown roleId number', () => {
    const result = changeMemberRoleBodySchema.safeParse({ roleId: 99 });
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { inviteMemberBodySchema } from '@infra/companies/entry-points/schemas/invite-member.schema.js';
import { CompanyMemberRoleId } from '@domain/catalog-ids.js';

describe('inviteMemberBodySchema', () => {
  it('accepts valid email and ADMIN roleId', () => {
    const result = inviteMemberBodySchema.safeParse({
      email: 'user@example.com',
      roleId: CompanyMemberRoleId.ADMIN,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid email and EDITOR roleId', () => {
    const result = inviteMemberBodySchema.safeParse({
      email: 'user@example.com',
      roleId: CompanyMemberRoleId.EDITOR,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid email and VIEWER roleId', () => {
    const result = inviteMemberBodySchema.safeParse({
      email: 'user@example.com',
      roleId: CompanyMemberRoleId.VIEWER,
    });
    expect(result.success).toBe(true);
  });

  it('rejects OWNER roleId', () => {
    const result = inviteMemberBodySchema.safeParse({
      email: 'user@example.com',
      roleId: CompanyMemberRoleId.OWNER,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = inviteMemberBodySchema.safeParse({
      email: 'not-an-email',
      roleId: CompanyMemberRoleId.EDITOR,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = inviteMemberBodySchema.safeParse({ roleId: CompanyMemberRoleId.EDITOR });
    expect(result.success).toBe(false);
  });

  it('rejects missing roleId', () => {
    const result = inviteMemberBodySchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown roleId', () => {
    const result = inviteMemberBodySchema.safeParse({ email: 'user@example.com', roleId: 99 });
    expect(result.success).toBe(false);
  });
});

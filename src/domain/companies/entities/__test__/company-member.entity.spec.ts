import { describe, it, expect } from 'vitest';
import { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
import { CompanyMemberRoleId, CompanyMemberStatusId } from '@domain/catalog-ids.js';
import { CannotChangeOwnerRoleError } from '@domain/companies/errors/cannot-change-owner-role.error.js';
import { CannotSuspendOwnerError } from '@domain/companies/errors/cannot-suspend-owner.error.js';

describe('CompanyMember.createOwner', () => {
  it('creates a member with OWNER role', () => {
    const member = CompanyMember.createOwner('id', 'company-id', 'user-id');

    expect(member.roleId).toBe(CompanyMemberRoleId.OWNER);
  });

  it('creates a member with ACTIVE status', () => {
    const member = CompanyMember.createOwner('id', 'company-id', 'user-id');

    expect(member.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('sets all ids correctly', () => {
    const member = CompanyMember.createOwner('member-id', 'company-id', 'user-id');

    expect(member.id).toBe('member-id');
    expect(member.companyId).toBe('company-id');
    expect(member.userId).toBe('user-id');
  });

  it('sets invitation fields to null — owners are not invited', () => {
    const member = CompanyMember.createOwner('id', 'company-id', 'user-id');

    expect(member.invitedAt).toBeNull();
    expect(member.invitedBy).toBeNull();
    expect(member.acceptedAt).toBeNull();
    expect(member.acceptedBy).toBeNull();
  });
});

describe('CompanyMember.isActive', () => {
  it('returns true when statusId is ACTIVE', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.ACTIVE,
      null,
      null,
      null,
      null,
    );

    expect(member.isActive()).toBe(true);
  });

  it('returns false when statusId is SUSPENDED', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.SUSPENDED,
      null,
      null,
      null,
      null,
    );

    expect(member.isActive()).toBe(false);
  });

  it('returns false when statusId is INACTIVE', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.INACTIVE,
      null,
      null,
      null,
      null,
    );

    expect(member.isActive()).toBe(false);
  });
});

describe('CompanyMember.canManageMembers', () => {
  it('returns true for OWNER role', () => {
    const member = CompanyMember.createOwner('id', 'company-id', 'user-id');

    expect(member.canManageMembers()).toBe(true);
  });

  it('returns true for ADMIN role', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.ADMIN,
      CompanyMemberStatusId.ACTIVE,
      null,
      null,
      null,
      null,
    );

    expect(member.canManageMembers()).toBe(true);
  });

  it('returns false for EDITOR role', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.ACTIVE,
      null,
      null,
      null,
      null,
    );

    expect(member.canManageMembers()).toBe(false);
  });

  it('returns false for VIEWER role', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.VIEWER,
      CompanyMemberStatusId.ACTIVE,
      null,
      null,
      null,
      null,
    );

    expect(member.canManageMembers()).toBe(false);
  });
});

describe('CompanyMember.changeRole', () => {
  it('returns a new member with updated roleId', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.ACTIVE,
      null,
      null,
      null,
      null,
    );

    const updated = member.changeRole(CompanyMemberRoleId.ADMIN);

    expect(updated).not.toBe(member);
    expect(updated.roleId).toBe(CompanyMemberRoleId.ADMIN);
  });

  it('preserves all other fields after role change', () => {
    const invitedAt = new Date('2026-01-01');
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.ACTIVE,
      invitedAt,
      'inviter-id',
      null,
      null,
    );

    const updated = member.changeRole(CompanyMemberRoleId.VIEWER);

    expect(updated.id).toBe(member.id);
    expect(updated.companyId).toBe(member.companyId);
    expect(updated.userId).toBe(member.userId);
    expect(updated.statusId).toBe(member.statusId);
    expect(updated.invitedAt).toEqual(invitedAt);
    expect(updated.invitedBy).toBe('inviter-id');
  });

  it('throws CannotChangeOwnerRoleError when member is OWNER', () => {
    const owner = CompanyMember.createOwner('id', 'company-id', 'user-id');

    expect(() => owner.changeRole(CompanyMemberRoleId.ADMIN)).toThrow(CannotChangeOwnerRoleError);
  });
});

describe('CompanyMember.suspend', () => {
  it('returns a new member with SUSPENDED status', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.ACTIVE,
      null,
      null,
      null,
      null,
    );

    const suspended = member.suspend();

    expect(suspended).not.toBe(member);
    expect(suspended.statusId).toBe(CompanyMemberStatusId.SUSPENDED);
  });

  it('preserves all other fields after suspension', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.ADMIN,
      CompanyMemberStatusId.ACTIVE,
      null,
      null,
      null,
      null,
    );

    const suspended = member.suspend();

    expect(suspended.id).toBe(member.id);
    expect(suspended.roleId).toBe(member.roleId);
    expect(suspended.userId).toBe(member.userId);
  });

  it('throws CannotSuspendOwnerError when member is OWNER', () => {
    const owner = CompanyMember.createOwner('id', 'company-id', 'user-id');

    expect(() => owner.suspend()).toThrow(CannotSuspendOwnerError);
  });
});

describe('CompanyMember.reconstitute', () => {
  it('reconstitutes a member with all fields', () => {
    const invitedAt = new Date('2026-01-01');
    const acceptedAt = new Date('2026-01-02');

    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.ACTIVE,
      invitedAt,
      'inviter-id',
      acceptedAt,
      'acceptor-id',
    );

    expect(member.roleId).toBe(CompanyMemberRoleId.EDITOR);
    expect(member.invitedAt).toEqual(invitedAt);
    expect(member.invitedBy).toBe('inviter-id');
    expect(member.acceptedAt).toEqual(acceptedAt);
    expect(member.acceptedBy).toBe('acceptor-id');
  });

  it('reconstitutes with nullable invitation fields', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.OWNER,
      CompanyMemberStatusId.ACTIVE,
      null,
      null,
      null,
      null,
    );

    expect(member.invitedAt).toBeNull();
    expect(member.invitedBy).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
import { CompanyMemberRoleId, CompanyMemberStatusId } from '@domain/catalog-ids.js';
import { CannotChangeOwnerRoleError } from '@domain/companies/errors/cannot-change-owner-role.error.js';
import { CannotAssignOwnerRoleError } from '@domain/companies/errors/cannot-assign-owner-role.error.js';
import { CannotSuspendOwnerError } from '@domain/companies/errors/cannot-suspend-owner.error.js';
import { CannotRemoveOwnerError } from '@domain/companies/errors/cannot-remove-owner.error.js';
import { MemberNotDeletedError } from '@domain/companies/errors/member-not-deleted.error.js';
import { MemberNotSuspendedError } from '@domain/companies/errors/member-not-suspended.error.js';

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

describe('CompanyMember.createInvited', () => {
  it('creates a member with the given roleId', () => {
    const member = CompanyMember.createInvited(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      'inviter-id',
    );

    expect(member.roleId).toBe(CompanyMemberRoleId.EDITOR);
  });

  it('creates a member with ACTIVE status', () => {
    const member = CompanyMember.createInvited(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.ADMIN,
      'inviter-id',
    );

    expect(member.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('sets invitedBy and acceptedBy to the inviter', () => {
    const member = CompanyMember.createInvited(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.VIEWER,
      'inviter-id',
    );

    expect(member.invitedBy).toBe('inviter-id');
    expect(member.acceptedBy).toBe('inviter-id');
  });

  it('sets invitedAt and acceptedAt to the same timestamp', () => {
    const member = CompanyMember.createInvited(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      'inviter-id',
    );

    expect(member.invitedAt).toBeInstanceOf(Date);
    expect(member.acceptedAt).toBeInstanceOf(Date);
    expect(member.invitedAt).toEqual(member.acceptedAt);
  });

  it('sets all ids correctly', () => {
    const member = CompanyMember.createInvited(
      'member-id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      'inviter-id',
    );

    expect(member.id).toBe('member-id');
    expect(member.companyId).toBe('company-id');
    expect(member.userId).toBe('user-id');
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

  it('throws CannotAssignOwnerRoleError when assigning OWNER role to a non-owner', () => {
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

    expect(() => member.changeRole(CompanyMemberRoleId.OWNER)).toThrow(CannotAssignOwnerRoleError);
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

describe('CompanyMember.unsuspend', () => {
  it('returns a new member with ACTIVE status when SUSPENDED', () => {
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

    const unsuspended = member.unsuspend();

    expect(unsuspended).not.toBe(member);
    expect(unsuspended.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('preserves all other fields after unsuspend', () => {
    const invitedAt = new Date('2026-01-01');
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.ADMIN,
      CompanyMemberStatusId.SUSPENDED,
      invitedAt,
      'inviter-id',
      null,
      null,
    );

    const unsuspended = member.unsuspend();

    expect(unsuspended.id).toBe(member.id);
    expect(unsuspended.roleId).toBe(member.roleId);
    expect(unsuspended.userId).toBe(member.userId);
    expect(unsuspended.companyId).toBe(member.companyId);
    expect(unsuspended.invitedAt).toEqual(invitedAt);
    expect(unsuspended.invitedBy).toBe('inviter-id');
  });

  it('throws MemberNotSuspendedError when member is ACTIVE', () => {
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

    expect(() => member.unsuspend()).toThrow(MemberNotSuspendedError);
  });

  it('throws MemberNotSuspendedError when member is DELETED', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.DELETED,
      null,
      null,
      null,
      null,
    );

    expect(() => member.unsuspend()).toThrow(MemberNotSuspendedError);
  });
});

describe('CompanyMember.reactivate', () => {
  it('returns a new member with ACTIVE status when DELETED', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.EDITOR,
      CompanyMemberStatusId.DELETED,
      null,
      null,
      null,
      null,
    );

    const reactivated = member.reactivate();

    expect(reactivated).not.toBe(member);
    expect(reactivated.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('preserves all other fields after reactivation', () => {
    const member = CompanyMember.reconstitute(
      'id',
      'company-id',
      'user-id',
      CompanyMemberRoleId.ADMIN,
      CompanyMemberStatusId.DELETED,
      null,
      null,
      null,
      null,
    );

    const reactivated = member.reactivate();

    expect(reactivated.id).toBe(member.id);
    expect(reactivated.roleId).toBe(member.roleId);
    expect(reactivated.userId).toBe(member.userId);
    expect(reactivated.companyId).toBe(member.companyId);
  });

  it('throws MemberNotDeletedError when member is ACTIVE', () => {
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

    expect(() => member.reactivate()).toThrow(MemberNotDeletedError);
  });

  it('throws MemberNotDeletedError when member is SUSPENDED', () => {
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

    expect(() => member.reactivate()).toThrow(MemberNotDeletedError);
  });
});

describe('CompanyMember.remove', () => {
  it('returns a new member with DELETED status', () => {
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

    const removed = member.remove();

    expect(removed).not.toBe(member);
    expect(removed.statusId).toBe(CompanyMemberStatusId.DELETED);
  });

  it('preserves all other fields after removal', () => {
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

    const removed = member.remove();

    expect(removed.id).toBe(member.id);
    expect(removed.roleId).toBe(member.roleId);
    expect(removed.userId).toBe(member.userId);
    expect(removed.companyId).toBe(member.companyId);
  });

  it('throws CannotRemoveOwnerError when member is OWNER', () => {
    const owner = CompanyMember.createOwner('id', 'company-id', 'user-id');

    expect(() => owner.remove()).toThrow(CannotRemoveOwnerError);
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

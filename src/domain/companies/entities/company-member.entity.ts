import { CompanyMemberRoleId, CompanyMemberStatusId } from '@domain/catalog-ids.js';
import { CannotChangeOwnerRoleError } from '@domain/companies/errors/cannot-change-owner-role.error.js';
import { CannotSuspendOwnerError } from '@domain/companies/errors/cannot-suspend-owner.error.js';
import { CannotRemoveOwnerError } from '@domain/companies/errors/cannot-remove-owner.error.js';
import { MemberNotDeletedError } from '@domain/companies/errors/member-not-deleted.error.js';

export class CompanyMember {
  private constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly userId: string,
    public readonly roleId: number,
    public readonly statusId: number,
    public readonly invitedAt: Date | null,
    public readonly invitedBy: string | null,
    public readonly acceptedAt: Date | null,
    public readonly acceptedBy: string | null,
  ) {}

  /**
   * Registers the company creator as OWNER.
   * Owners are not invited — they create the company directly.
   */
  static createOwner(id: string, companyId: string, userId: string): CompanyMember {
    return new CompanyMember(
      id,
      companyId,
      userId,
      CompanyMemberRoleId.OWNER,
      CompanyMemberStatusId.ACTIVE,
      null,
      null,
      null,
      null,
    );
  }

  isActive(): boolean {
    return this.statusId === CompanyMemberStatusId.ACTIVE;
  }

  canManageMembers(): boolean {
    return this.roleId === CompanyMemberRoleId.OWNER || this.roleId === CompanyMemberRoleId.ADMIN;
  }

  changeRole(newRoleId: number): CompanyMember {
    if (this.roleId === CompanyMemberRoleId.OWNER) throw new CannotChangeOwnerRoleError();
    return new CompanyMember(
      this.id,
      this.companyId,
      this.userId,
      newRoleId,
      this.statusId,
      this.invitedAt,
      this.invitedBy,
      this.acceptedAt,
      this.acceptedBy,
    );
  }

  suspend(): CompanyMember {
    if (this.roleId === CompanyMemberRoleId.OWNER) throw new CannotSuspendOwnerError();
    return new CompanyMember(
      this.id,
      this.companyId,
      this.userId,
      this.roleId,
      CompanyMemberStatusId.SUSPENDED,
      this.invitedAt,
      this.invitedBy,
      this.acceptedAt,
      this.acceptedBy,
    );
  }

  reactivate(): CompanyMember {
    if (this.statusId !== CompanyMemberStatusId.DELETED)
      throw new MemberNotDeletedError(this.userId);
    return new CompanyMember(
      this.id,
      this.companyId,
      this.userId,
      this.roleId,
      CompanyMemberStatusId.ACTIVE,
      this.invitedAt,
      this.invitedBy,
      this.acceptedAt,
      this.acceptedBy,
    );
  }

  remove(): CompanyMember {
    if (this.roleId === CompanyMemberRoleId.OWNER) throw new CannotRemoveOwnerError();
    return new CompanyMember(
      this.id,
      this.companyId,
      this.userId,
      this.roleId,
      CompanyMemberStatusId.DELETED,
      this.invitedAt,
      this.invitedBy,
      this.acceptedAt,
      this.acceptedBy,
    );
  }

  static reconstitute(
    id: string,
    companyId: string,
    userId: string,
    roleId: number,
    statusId: number,
    invitedAt: Date | null,
    invitedBy: string | null,
    acceptedAt: Date | null,
    acceptedBy: string | null,
  ): CompanyMember {
    return new CompanyMember(
      id,
      companyId,
      userId,
      roleId,
      statusId,
      invitedAt,
      invitedBy,
      acceptedAt,
      acceptedBy,
    );
  }
}

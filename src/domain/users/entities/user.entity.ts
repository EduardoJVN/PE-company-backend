import { UserStatusId, UserRoleId, RegisterTypeId } from '@domain/catalog-ids.js';

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly statusId: UserStatusId,
    public readonly roleId: UserRoleId,
    public readonly registerTypeId: RegisterTypeId,
  ) {}

  /**
   * Creates a user via company invitation.
   * They must set a password before they can log in (CHANGE_PASSWORD status).
   */
  static createInvited(id: string, email: string): User {
    return new User(id, email, UserStatusId.CHANGE_PASSWORD, UserRoleId.USER, RegisterTypeId.EMAIL);
  }

  static reconstitute(
    id: string,
    email: string,
    statusId: UserStatusId,
    roleId: UserRoleId,
    registerTypeId: RegisterTypeId,
  ): User {
    return new User(id, email, statusId, roleId, registerTypeId);
  }
}

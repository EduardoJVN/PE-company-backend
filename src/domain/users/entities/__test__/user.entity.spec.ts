import { describe, it, expect } from 'vitest';
import { User } from '@domain/users/entities/user.entity.js';
import { UserStatusId, UserRoleId, RegisterTypeId } from '@domain/catalog-ids.js';

describe('User.createInvited', () => {
  it('creates a user with CHANGE_PASSWORD status', () => {
    const user = User.createInvited('user-id', 'test@example.com');
    expect(user.statusId).toBe(UserStatusId.CHANGE_PASSWORD);
  });

  it('creates a user with USER role', () => {
    const user = User.createInvited('user-id', 'test@example.com');
    expect(user.roleId).toBe(UserRoleId.USER);
  });

  it('creates a user with EMAIL register type', () => {
    const user = User.createInvited('user-id', 'test@example.com');
    expect(user.registerTypeId).toBe(RegisterTypeId.EMAIL);
  });

  it('assigns the provided id and email', () => {
    const user = User.createInvited('user-uuid-123', 'invited@example.com');
    expect(user.id).toBe('user-uuid-123');
    expect(user.email).toBe('invited@example.com');
  });
});

describe('User.reconstitute', () => {
  it('restores all fields as provided', () => {
    const user = User.reconstitute(
      'user-id',
      'test@example.com',
      UserStatusId.ACTIVE,
      UserRoleId.USER,
      RegisterTypeId.EMAIL,
    );
    expect(user.id).toBe('user-id');
    expect(user.email).toBe('test@example.com');
    expect(user.statusId).toBe(UserStatusId.ACTIVE);
    expect(user.roleId).toBe(UserRoleId.USER);
    expect(user.registerTypeId).toBe(RegisterTypeId.EMAIL);
  });
});

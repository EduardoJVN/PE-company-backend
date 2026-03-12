import type { User } from '@domain/users/entities/user.entity.js';

export interface UserResult {
  id: string;
  email: string;
  statusId: number;
}

export interface IUserPort {
  findByEmail(email: string): Promise<UserResult | null>;
  createInvited(user: User): Promise<UserResult>;
  upsertInviteToken(id: string, userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
}

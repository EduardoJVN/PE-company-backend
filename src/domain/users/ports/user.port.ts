import type { User } from '@domain/users/entities/user.entity.js';
import type { EmailVerificationToken } from '@domain/auth/entities/email-verification-token.entity.js';

export interface UserResult {
  id: string;
  email: string;
  statusId: number;
}

export interface IUserPort {
  findByEmail(email: string): Promise<UserResult | null>;
  createInvited(user: User): Promise<UserResult>;
  saveEmailVerificationToken(token: EmailVerificationToken): Promise<void>;
}

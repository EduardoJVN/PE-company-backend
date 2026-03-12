import type { PrismaClient } from '@prisma/client';
import type { IUserPort, UserResult } from '@domain/users/ports/user.port.js';
import type { User } from '@domain/users/entities/user.entity.js';
import type { EmailVerificationToken } from '@domain/auth/entities/email-verification-token.entity.js';

const COMPANY_INVITE_TOKEN_TYPE = 'COMPANY_INVITE';

export class PrismaUserPort implements IUserPort {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<UserResult | null> {
    return this.db.user.findFirst({
      where: { email },
      select: { id: true, email: true, statusId: true },
    });
  }

  async createInvited(user: User): Promise<UserResult> {
    return this.db.user.create({
      data: {
        id: user.id,
        email: user.email,
        statusId: user.statusId,
        roleId: user.roleId,
        registerTypeId: user.registerTypeId,
      },
      select: { id: true, email: true, statusId: true },
    });
  }

  async saveEmailVerificationToken(token: EmailVerificationToken): Promise<void> {
    await this.db.emailVerificationToken.upsert({
      where: { userId: token.userId },
      create: {
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        type: COMPANY_INVITE_TOKEN_TYPE,
        expiresAt: token.expiresAt,
      },
      update: {
        id: token.id,
        tokenHash: token.tokenHash,
        type: COMPANY_INVITE_TOKEN_TYPE,
        expiresAt: token.expiresAt,
        usedAt: null,
      },
    });
  }
}

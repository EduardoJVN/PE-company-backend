import type { PrismaClient } from '@prisma/client';
import type { IUserPort, UserResult } from '@domain/users/ports/user.port.js';
import type { User } from '@domain/users/entities/user.entity.js';

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

  async upsertInviteToken(
    id: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.db.emailVerificationToken.upsert({
      where: { userId },
      create: { id, userId, tokenHash, type: COMPANY_INVITE_TOKEN_TYPE, expiresAt },
      update: { id, tokenHash, type: COMPANY_INVITE_TOKEN_TYPE, expiresAt, usedAt: null },
    });
  }
}

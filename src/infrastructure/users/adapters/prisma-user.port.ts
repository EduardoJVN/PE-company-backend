import type { PrismaClient } from '@prisma/client';
import { UserStatusId } from '@domain/catalog-ids.js';
import type { IUserPort, UserResult } from '@domain/users/ports/user.port.js';

const COMPANY_INVITE_TOKEN_TYPE = 'COMPANY_INVITE';

export class PrismaUserPort implements IUserPort {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<UserResult | null> {
    return this.db.user.findFirst({
      where: { email },
      select: { id: true, email: true, statusId: true },
    });
  }

  async createInvited(id: string, email: string): Promise<UserResult> {
    return this.db.user.create({
      data: {
        id,
        email,
        statusId: UserStatusId.CHANGE_PASSWORD,
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

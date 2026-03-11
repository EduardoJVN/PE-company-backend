import type { PrismaClient } from '@prisma/client';
import type {
  ICompanyRepository,
  CreateCompanyData,
  CreateMemberData,
  CompanyResult,
} from '@domain/companies/ports/company-repository.port.js';

const companySelect = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  logoUrl: true,
  statusId: true,
  isActive: true,
  isVerified: true,
  createdAt: true,
} as const;

export class PrismaCompanyRepository implements ICompanyRepository {
  constructor(private readonly db: PrismaClient) {}

  async createWithOwner(
    company: CreateCompanyData,
    member: CreateMemberData,
  ): Promise<CompanyResult> {
    return this.db.company.create({
      data: {
        id: company.id,
        ownerId: company.ownerId,
        name: company.name,
        description: company.description ?? null,
        logoUrl: company.logoUrl ?? null,
        statusId: company.statusId,
        sectors: { create: company.sectorIds.map((sectorId) => ({ sectorId })) },
        members: {
          create: {
            id: member.id,
            userId: member.userId,
            roleId: member.roleId,
            statusId: member.statusId,
          },
        },
      },
      select: companySelect,
    });
  }
}

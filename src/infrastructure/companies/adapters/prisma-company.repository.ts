import type { PrismaClient } from '@prisma/client';
import { CompanyMemberStatusId } from '@domain/catalog-ids.js';
import type { Company } from '@domain/companies/entities/company.entity.js';
import type { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
import type {
  ICompanyRepository,
  CompanyResult,
  CompanyDetailResult,
  CompanyMemberResult,
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

const companyDetailSelect = {
  ...companySelect,
  updatedAt: true,
  verifiedAt: true,
  verifiedBy: true,
  deletedAt: true,
  sectors: { select: { sector: { select: { id: true, name: true } } } },
} as const;

export class PrismaCompanyRepository implements ICompanyRepository {
  constructor(private readonly db: PrismaClient) {}

  async createWithOwner(company: Company, member: CompanyMember): Promise<CompanyResult> {
    return this.db.company.create({
      data: {
        id: company.id,
        ownerId: company.ownerId,
        name: company.name,
        description: company.description,
        logoUrl: company.logoUrl,
        statusId: company.statusId,
        sectors: { create: company.sectorIds.map((sectorId) => ({ sectorId })) },
        members: {
          create: {
            id: member.id,
            userId: member.userId,
            roleId: member.roleId,
            statusId: member.statusId,
            invitedAt: member.invitedAt,
            invitedBy: member.invitedBy,
            acceptedAt: member.acceptedAt,
            acceptedBy: member.acceptedBy,
          },
        },
      },
      select: companySelect,
    });
  }

  async update(company: Company): Promise<CompanyResult> {
    return this.db.company.update({
      where: { id: company.id },
      data: {
        name: company.name,
        description: company.description,
        logoUrl: company.logoUrl,
        updatedAt: company.updatedAt,
      },
      select: companySelect,
    });
  }

  async findByMemberId(userId: string): Promise<CompanyResult[]> {
    return this.db.company.findMany({
      where: {
        members: {
          some: {
            userId,
            statusId: CompanyMemberStatusId.ACTIVE,
          },
        },
      },
      select: companySelect,
    });
  }

  async findByIdForMember(companyId: string, userId: string): Promise<CompanyDetailResult | null> {
    const company = await this.db.company.findFirst({
      where: {
        id: companyId,
        members: {
          some: {
            userId,
            statusId: CompanyMemberStatusId.ACTIVE,
          },
        },
      },
      select: companyDetailSelect,
    });

    if (!company) return null;

    return {
      id: company.id,
      ownerId: company.ownerId,
      name: company.name,
      description: company.description,
      logoUrl: company.logoUrl,
      statusId: company.statusId,
      isActive: company.isActive,
      isVerified: company.isVerified,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      verifiedAt: company.verifiedAt,
      verifiedBy: company.verifiedBy,
      deletedAt: company.deletedAt,
      sectors: company.sectors.map((s) => s.sector),
    };
  }

  async updateMemberRole(member: CompanyMember): Promise<CompanyMemberResult> {
    return this.db.companyMember.update({
      where: { id: member.id },
      data: { roleId: member.roleId },
      select: {
        id: true,
        companyId: true,
        userId: true,
        roleId: true,
        statusId: true,
        invitedAt: true,
        invitedBy: true,
        acceptedAt: true,
        acceptedBy: true,
      },
    });
  }

  async findMemberByUserAndCompany(
    companyId: string,
    userId: string,
  ): Promise<CompanyMemberResult | null> {
    return this.db.companyMember.findFirst({
      where: {
        companyId,
        userId,
        statusId: CompanyMemberStatusId.ACTIVE,
      },
      select: {
        id: true,
        companyId: true,
        userId: true,
        roleId: true,
        statusId: true,
        invitedAt: true,
        invitedBy: true,
        acceptedAt: true,
        acceptedBy: true,
      },
    });
  }
}

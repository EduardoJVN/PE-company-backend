import type { Company } from '@domain/companies/entities/company.entity.js';
import type { CompanyMember } from '@domain/companies/entities/company-member.entity.js';

export interface CompanyResult {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  statusId: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface CompanySector {
  id: number;
  name: string;
}

export interface CompanyDetailResult extends CompanyResult {
  updatedAt: Date;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  deletedAt: Date | null;
  sectors: CompanySector[];
}

export interface CompanyMemberResult {
  id: string;
  companyId: string;
  userId: string;
  roleId: number;
  statusId: number;
  invitedAt: Date | null;
  invitedBy: string | null;
  acceptedAt: Date | null;
  acceptedBy: string | null;
}

export interface ICompanyRepository {
  createWithOwner(company: Company, member: CompanyMember): Promise<CompanyResult>;
  update(company: Company): Promise<CompanyResult>;
  updateMemberRole(member: CompanyMember): Promise<CompanyMemberResult>;
  removeMember(member: CompanyMember): Promise<void>;
  activateMember(member: CompanyMember): Promise<void>;
  findByMemberId(userId: string): Promise<CompanyResult[]>;
  findByIdForMember(companyId: string, userId: string): Promise<CompanyDetailResult | null>;
  findMemberByUserAndCompany(
    companyId: string,
    userId: string,
  ): Promise<CompanyMemberResult | null>;
  findMemberByUserAndCompanyAnyStatus(
    companyId: string,
    userId: string,
  ): Promise<CompanyMemberResult | null>;
}

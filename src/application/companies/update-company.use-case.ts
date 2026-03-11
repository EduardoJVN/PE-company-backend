import { Company } from '@domain/companies/entities/company.entity.js';
import { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import type {
  ICompanyRepository,
  CompanyResult,
} from '@domain/companies/ports/company-repository.port.js';

export interface UpdateCompanyInput {
  companyId: string;
  userId: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
}

export class UpdateCompanyUseCase {
  constructor(private readonly companyRepo: ICompanyRepository) {}

  async execute(input: UpdateCompanyInput): Promise<CompanyResult> {
    const [companyDetail, memberResult] = await Promise.all([
      this.companyRepo.findByIdForMember(input.companyId, input.userId),
      this.companyRepo.findMemberByUserAndCompany(input.companyId, input.userId),
    ]);

    if (!companyDetail || !memberResult) throw new CompanyNotFoundError(input.companyId);

    const member = CompanyMember.reconstitute(
      memberResult.id,
      memberResult.companyId,
      memberResult.userId,
      memberResult.roleId,
      memberResult.statusId,
      memberResult.invitedAt,
      memberResult.invitedBy,
      memberResult.acceptedAt,
      memberResult.acceptedBy,
    );

    if (!member.canManageMembers()) throw new UnauthorizedCompanyAccessError(input.companyId);

    const company = Company.reconstitute(
      companyDetail.id,
      companyDetail.ownerId,
      companyDetail.name,
      companyDetail.description,
      companyDetail.logoUrl,
      companyDetail.statusId,
      companyDetail.sectors.map((s) => s.id),
      companyDetail.isActive,
      companyDetail.isVerified,
      companyDetail.verifiedAt,
      companyDetail.verifiedBy,
      companyDetail.createdAt,
      companyDetail.updatedAt,
      companyDetail.deletedAt,
    );

    const updated = company.update(input.name, input.description, input.logoUrl);

    return this.companyRepo.update(updated);
  }
}

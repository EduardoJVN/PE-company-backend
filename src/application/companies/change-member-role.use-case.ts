import { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { CompanyMemberNotFoundError } from '@domain/companies/errors/company-member-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import type {
  ICompanyRepository,
  CompanyMemberResult,
} from '@domain/companies/ports/company-repository.port.js';

export interface ChangeMemberRoleInput {
  companyId: string;
  requesterId: string;
  targetUserId: string;
  newRoleId: number;
}

export class ChangeMemberRoleUseCase {
  constructor(private readonly companyRepo: ICompanyRepository) {}

  async execute(input: ChangeMemberRoleInput): Promise<CompanyMemberResult> {
    const requesterResult = await this.companyRepo.findMemberByUserAndCompany(
      input.companyId,
      input.requesterId,
    );

    if (!requesterResult) throw new CompanyNotFoundError(input.companyId);

    const requester = CompanyMember.reconstitute(
      requesterResult.id,
      requesterResult.companyId,
      requesterResult.userId,
      requesterResult.roleId,
      requesterResult.statusId,
      requesterResult.invitedAt,
      requesterResult.invitedBy,
      requesterResult.acceptedAt,
      requesterResult.acceptedBy,
    );

    if (!requester.canManageMembers()) throw new UnauthorizedCompanyAccessError(input.companyId);

    const targetResult = await this.companyRepo.findMemberByUserAndCompany(
      input.companyId,
      input.targetUserId,
    );

    if (!targetResult) throw new CompanyMemberNotFoundError(input.targetUserId);

    const target = CompanyMember.reconstitute(
      targetResult.id,
      targetResult.companyId,
      targetResult.userId,
      targetResult.roleId,
      targetResult.statusId,
      targetResult.invitedAt,
      targetResult.invitedBy,
      targetResult.acceptedAt,
      targetResult.acceptedBy,
    );

    const updated = target.changeRole(input.newRoleId);

    return this.companyRepo.updateMemberRole(updated);
  }
}

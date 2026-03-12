import { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { CompanyMemberNotFoundError } from '@domain/companies/errors/company-member-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import type { ICompanyRepository } from '@domain/companies/ports/company-repository.port.js';

export interface RemoveCompanyMemberInput {
  companyId: string;
  requesterId: string;
  targetUserId: string;
}

export class RemoveCompanyMemberUseCase {
  constructor(private readonly companyRepo: ICompanyRepository) {}

  async execute(input: RemoveCompanyMemberInput): Promise<void> {
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

    const removed = target.remove();

    await this.companyRepo.removeMember(removed);
  }
}

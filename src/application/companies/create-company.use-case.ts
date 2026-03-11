import { uuidv7 } from 'uuidv7';
import {
  CompanyStatusId,
  CompanyMemberRoleId,
  CompanyMemberStatusId,
} from '@domain/catalog-ids.js';
import type {
  ICompanyRepository,
  CompanyResult,
} from '@domain/companies/ports/company-repository.port.js';

export interface CreateCompanyInput {
  ownerId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  sectorIds?: number[];
}

export class CreateCompanyUseCase {
  constructor(private readonly companyRepo: ICompanyRepository) {}

  async execute(input: CreateCompanyInput): Promise<CompanyResult> {
    const companyId = uuidv7();
    const memberId = uuidv7();

    return this.companyRepo.createWithOwner(
      {
        id: companyId,
        ownerId: input.ownerId,
        name: input.name,
        description: input.description,
        logoUrl: input.logoUrl,
        statusId: CompanyStatusId.ACTIVE,
        sectorIds: input.sectorIds,
      },
      {
        id: memberId,
        companyId,
        userId: input.ownerId,
        roleId: CompanyMemberRoleId.OWNER,
        statusId: CompanyMemberStatusId.ACTIVE,
      },
    );
  }
}

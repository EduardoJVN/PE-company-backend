import { uuidv7 } from 'uuidv7';
import { Company } from '@domain/companies/entities/company.entity.js';
import { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
import type {
  ICompanyRepository,
  CompanyResult,
} from '@domain/companies/ports/company-repository.port.js';

export interface CreateCompanyInput {
  ownerId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  sectorIds: number[];
}

export class CreateCompanyUseCase {
  constructor(private readonly companyRepo: ICompanyRepository) {}

  async execute(input: CreateCompanyInput): Promise<CompanyResult> {
    const companyId = uuidv7();
    const memberId = uuidv7();

    const company = Company.create(
      companyId,
      input.ownerId,
      input.name,
      input.sectorIds,
      input.description,
      input.logoUrl,
    );

    const member = CompanyMember.createOwner(memberId, company.id, input.ownerId);

    return this.companyRepo.createWithOwner(company, member);
  }
}

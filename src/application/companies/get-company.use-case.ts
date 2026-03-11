import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import type {
  ICompanyRepository,
  CompanyDetailResult,
} from '@domain/companies/ports/company-repository.port.js';

export interface GetCompanyInput {
  companyId: string;
  userId: string;
}

export class GetCompanyUseCase {
  constructor(private readonly companyRepo: ICompanyRepository) {}

  async execute(input: GetCompanyInput): Promise<CompanyDetailResult> {
    const company = await this.companyRepo.findByIdForMember(input.companyId, input.userId);
    if (!company) throw new CompanyNotFoundError(input.companyId);
    return company;
  }
}

import type {
  ICompanyRepository,
  CompanyResult,
} from '@domain/companies/ports/company-repository.port.js';

export interface ListMyCompaniesInput {
  userId: string;
}

export class ListMyCompaniesUseCase {
  constructor(private readonly companyRepo: ICompanyRepository) {}

  async execute(input: ListMyCompaniesInput): Promise<CompanyResult[]> {
    return this.companyRepo.findByMemberId(input.userId);
  }
}

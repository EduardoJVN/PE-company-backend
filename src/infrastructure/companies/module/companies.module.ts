import { prisma } from '@infra/config/prisma.js';
import { PrismaCompanyRepository } from '@infra/companies/adapters/prisma-company.repository.js';
import { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import { CompanyController } from '@infra/companies/entry-points/company.controller.js';

export interface CompaniesModule {
  companyController: CompanyController;
}

export function createCompaniesModule(): CompaniesModule {
  const companyRepo = new PrismaCompanyRepository(prisma);
  const createCompanyUseCase = new CreateCompanyUseCase(companyRepo);
  const companyController = new CompanyController(createCompanyUseCase);

  return { companyController };
}

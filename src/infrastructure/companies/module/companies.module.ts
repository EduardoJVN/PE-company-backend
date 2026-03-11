import { prisma } from '@infra/config/prisma.js';
import { PrismaCompanyRepository } from '@infra/companies/adapters/prisma-company.repository.js';
import { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import { ListMyCompaniesUseCase } from '@application/companies/list-my-companies.use-case.js';
import { GetCompanyUseCase } from '@application/companies/get-company.use-case.js';
import { UpdateCompanyUseCase } from '@application/companies/update-company.use-case.js';
import { CompanyController } from '@infra/companies/entry-points/company.controller.js';

export interface CompaniesModule {
  companyController: CompanyController;
}

export function createCompaniesModule(): CompaniesModule {
  const companyRepo = new PrismaCompanyRepository(prisma);
  const createCompanyUseCase = new CreateCompanyUseCase(companyRepo);
  const listMyCompaniesUseCase = new ListMyCompaniesUseCase(companyRepo);
  const getCompanyUseCase = new GetCompanyUseCase(companyRepo);
  const updateCompanyUseCase = new UpdateCompanyUseCase(companyRepo);
  const companyController = new CompanyController(
    createCompanyUseCase,
    listMyCompaniesUseCase,
    getCompanyUseCase,
    updateCompanyUseCase,
  );

  return { companyController };
}

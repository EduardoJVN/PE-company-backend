import { prisma } from '@infra/config/prisma.js';
import { ENV } from '@infra/config/env.config.js';
import { PrismaCompanyRepository } from '@infra/companies/adapters/prisma-company.repository.js';
import { PrismaUserPort } from '@infra/users/adapters/prisma-user.port.js';
import { ResendEmailAdapter } from '@infra/adapters/resend-email.adapter.js';
import { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import { ListMyCompaniesUseCase } from '@application/companies/list-my-companies.use-case.js';
import { GetCompanyUseCase } from '@application/companies/get-company.use-case.js';
import { UpdateCompanyUseCase } from '@application/companies/update-company.use-case.js';
import { ChangeMemberRoleUseCase } from '@application/companies/change-member-role.use-case.js';
import { RemoveCompanyMemberUseCase } from '@application/companies/remove-company-member.use-case.js';
import { ActivateCompanyMemberUseCase } from '@application/companies/activate-company-member.use-case.js';
import { InviteCompanyMemberUseCase } from '@application/companies/invite-company-member.use-case.js';
import { CompanyController } from '@infra/companies/entry-points/company.controller.js';

export interface CompaniesModule {
  companyController: CompanyController;
}

export function createCompaniesModule(): CompaniesModule {
  const companyRepo = new PrismaCompanyRepository(prisma);
  const userPort = new PrismaUserPort(prisma);
  const emailSender = new ResendEmailAdapter(ENV.RESEND_API_KEY, ENV.RESEND_FROM_EMAIL);
  const createCompanyUseCase = new CreateCompanyUseCase(companyRepo);
  const listMyCompaniesUseCase = new ListMyCompaniesUseCase(companyRepo);
  const getCompanyUseCase = new GetCompanyUseCase(companyRepo);
  const updateCompanyUseCase = new UpdateCompanyUseCase(companyRepo);
  const changeMemberRoleUseCase = new ChangeMemberRoleUseCase(companyRepo);
  const removeCompanyMemberUseCase = new RemoveCompanyMemberUseCase(companyRepo);
  const activateCompanyMemberUseCase = new ActivateCompanyMemberUseCase(companyRepo);
  const inviteCompanyMemberUseCase = new InviteCompanyMemberUseCase(
    companyRepo,
    userPort,
    emailSender,
  );
  const companyController = new CompanyController(
    createCompanyUseCase,
    listMyCompaniesUseCase,
    getCompanyUseCase,
    updateCompanyUseCase,
    changeMemberRoleUseCase,
    removeCompanyMemberUseCase,
    activateCompanyMemberUseCase,
    inviteCompanyMemberUseCase,
    ENV.FRONTEND_URL,
  );

  return { companyController };
}

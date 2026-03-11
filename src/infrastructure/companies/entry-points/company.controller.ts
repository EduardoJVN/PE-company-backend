import { BaseController } from '@infra/entry-points/base.controller.js';
import { ValidationError } from '@shared/errors/validation.error.js';
import { createCompanyBodySchema } from '@infra/companies/entry-points/schemas/create-company.schema.js';
import { updateCompanyBodySchema } from '@infra/companies/entry-points/schemas/update-company.schema.js';
import { changeMemberRoleBodySchema } from '@infra/companies/entry-points/schemas/change-member-role.schema.js';
import type {
  AuthenticatedRequest,
  HttpResponse,
  ErrorResponse,
} from '@infra/entry-points/base.controller.js';
import type { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import type { ListMyCompaniesUseCase } from '@application/companies/list-my-companies.use-case.js';
import type { GetCompanyUseCase } from '@application/companies/get-company.use-case.js';
import type { UpdateCompanyUseCase } from '@application/companies/update-company.use-case.js';
import type { ChangeMemberRoleUseCase } from '@application/companies/change-member-role.use-case.js';
import type { RemoveCompanyMemberUseCase } from '@application/companies/remove-company-member.use-case.js';
import type { ActivateCompanyMemberUseCase } from '@application/companies/activate-company-member.use-case.js';

export class CompanyController extends BaseController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly listMyCompaniesUseCase: ListMyCompaniesUseCase,
    private readonly getCompanyUseCase: GetCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly changeMemberRoleUseCase: ChangeMemberRoleUseCase,
    private readonly removeCompanyMemberUseCase: RemoveCompanyMemberUseCase,
    private readonly activateCompanyMemberUseCase: ActivateCompanyMemberUseCase,
  ) {
    super();
  }

  async create(req: AuthenticatedRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const parsed = createCompanyBodySchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
        }
        return this.createCompanyUseCase.execute({ ownerId: req.userId, ...parsed.data });
      },
      (result) => ({ status: 201, body: result }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }

  async listMine(req: AuthenticatedRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => this.listMyCompaniesUseCase.execute({ userId: req.userId }),
      (result) => ({ status: 200, body: result }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }

  async getById(req: AuthenticatedRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const companyId = req.params?.['id'];
        if (!companyId) throw new ValidationError('Company ID is required');
        return this.getCompanyUseCase.execute({ companyId, userId: req.userId });
      },
      (result) => ({ status: 200, body: result }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }

  async update(req: AuthenticatedRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const companyId = req.params?.['id'];
        if (!companyId) throw new ValidationError('Company ID is required');
        const parsed = updateCompanyBodySchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
        }
        return this.updateCompanyUseCase.execute({ companyId, userId: req.userId, ...parsed.data });
      },
      (result) => ({ status: 200, body: result }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }

  async changeMemberRole(req: AuthenticatedRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const companyId = req.params?.['id'];
        const targetUserId = req.params?.['userId'];
        if (!companyId) throw new ValidationError('Company ID is required');
        if (!targetUserId) throw new ValidationError('User ID is required');
        const parsed = changeMemberRoleBodySchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
        }
        return this.changeMemberRoleUseCase.execute({
          companyId,
          requesterId: req.userId,
          targetUserId,
          newRoleId: parsed.data.roleId,
        });
      },
      (result) => ({ status: 200, body: result }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }

  async activateMember(req: AuthenticatedRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const companyId = req.params?.['id'];
        const targetUserId = req.params?.['userId'];
        if (!companyId) throw new ValidationError('Company ID is required');
        if (!targetUserId) throw new ValidationError('User ID is required');
        return this.activateCompanyMemberUseCase.execute({
          companyId,
          requesterId: req.userId,
          targetUserId,
        });
      },
      () => ({ status: 204, body: null }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }

  async removeMember(req: AuthenticatedRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const companyId = req.params?.['id'];
        const targetUserId = req.params?.['userId'];
        if (!companyId) throw new ValidationError('Company ID is required');
        if (!targetUserId) throw new ValidationError('User ID is required');
        return this.removeCompanyMemberUseCase.execute({
          companyId,
          requesterId: req.userId,
          targetUserId,
        });
      },
      () => ({ status: 204, body: null }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }
}

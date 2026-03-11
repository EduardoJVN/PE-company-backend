import { BaseController } from '@infra/entry-points/base.controller.js';
import { ValidationError } from '@shared/errors/validation.error.js';
import { createCompanyBodySchema } from '@infra/companies/entry-points/schemas/create-company.schema.js';
import type {
  AuthenticatedRequest,
  HttpResponse,
  ErrorResponse,
} from '@infra/entry-points/base.controller.js';
import type { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import type { ListMyCompaniesUseCase } from '@application/companies/list-my-companies.use-case.js';

export class CompanyController extends BaseController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly listMyCompaniesUseCase: ListMyCompaniesUseCase,
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
}

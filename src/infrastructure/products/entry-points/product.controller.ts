import { BaseController } from '@infra/entry-points/base.controller.js';
import { ValidationError } from '@shared/errors/validation.error.js';
import { CreateProductSchema } from '@infra/products/entry-points/schemas/create-product.schema.js';
import type {
  CompanyContextRequest,
  HttpResponse,
  ErrorResponse,
} from '@infra/entry-points/base.controller.js';
import type { CreateProductUseCase } from '@application/products/create-product.use-case.js';

export class ProductController extends BaseController {
  constructor(private readonly createProductUseCase: CreateProductUseCase) {
    super();
  }

  async create(req: CompanyContextRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const parsed = CreateProductSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
        }
        return this.createProductUseCase.execute({
          companyId: req.companyId,
          createdBy: req.userId,
          ...parsed.data,
        });
      },
      (result) => ({ status: 201, body: result }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }
}

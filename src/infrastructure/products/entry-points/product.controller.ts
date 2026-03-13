import { BaseController } from '@infra/entry-points/base.controller.js';
import { ValidationError } from '@shared/errors/validation.error.js';
import { CreateProductSchema } from '@infra/products/entry-points/schemas/create-product.schema.js';
import {
  ListProductsSchema,
  extractSpecsFilter,
} from '@infra/products/entry-points/schemas/list-products.schema.js';
import type {
  CompanyContextRequest,
  HttpResponse,
  ErrorResponse,
} from '@infra/entry-points/base.controller.js';
import type { CreateProductUseCase } from '@application/products/create-product.use-case.js';
import type { ListProductsUseCase } from '@application/products/list-products.use-case.js';

export class ProductController extends BaseController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
  ) {
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

  async list(req: CompanyContextRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const raw = req.query ?? {};
        const parsed = ListProductsSchema.safeParse(raw);
        if (!parsed.success) {
          throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
        }
        const { page, limit, name, categoryId, minStock, maxStock, ...rest } = parsed.data;
        return this.listProductsUseCase.execute({
          companyId: req.companyId,
          page,
          limit,
          filter: {
            name,
            categoryId,
            minStock,
            maxStock,
            specs: extractSpecsFilter(rest as Record<string, unknown>),
          },
        });
      },
      (result) => ({ status: 200, body: result }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }
}

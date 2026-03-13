import { BaseController } from '@infra/entry-points/base.controller.js';
import { ValidationError } from '@shared/errors/validation.error.js';
import { CreateProductSchema } from '@infra/products/entry-points/schemas/create-product.schema.js';
import {
  ListProductsSchema,
  extractSpecsFilter,
} from '@infra/products/entry-points/schemas/list-products.schema.js';
import { GetProductParamsSchema } from '@infra/products/entry-points/schemas/get-product-params.schema.js';
import { UpdateProductSchema } from '@infra/products/entry-points/schemas/update-product.schema.js';
import type {
  CompanyContextRequest,
  HttpResponse,
  ErrorResponse,
} from '@infra/entry-points/base.controller.js';
import type { CreateProductUseCase } from '@application/products/create-product.use-case.js';
import type { ListProductsUseCase } from '@application/products/list-products.use-case.js';
import type { GetProductUseCase } from '@application/products/get-product.use-case.js';
import type { UpdateProductUseCase } from '@application/products/update-product.use-case.js';
import type { DeleteProductUseCase } from '@application/products/delete-product.use-case.js';

export class ProductController extends BaseController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {
    super();
  }

  async getById(req: CompanyContextRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const parsed = GetProductParamsSchema.safeParse(req.params);
        if (!parsed.success) {
          throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
        }
        return this.getProductUseCase.execute({
          companyId: req.companyId,
          id: parsed.data.id,
        });
      },
      (result) => ({ status: 200, body: result }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }

  async delete(req: CompanyContextRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const parsed = GetProductParamsSchema.safeParse(req.params);
        if (!parsed.success) {
          throw new ValidationError(parsed.error.issues.map((i) => i.message).join(', '));
        }
        return this.deleteProductUseCase.execute({
          companyId: req.companyId,
          id: parsed.data.id,
        });
      },
      () => ({ status: 204, body: null }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
  }

  async update(req: CompanyContextRequest): Promise<HttpResponse> {
    return this.handleRequest(
      () => {
        const params = GetProductParamsSchema.safeParse(req.params);
        if (!params.success) {
          throw new ValidationError(params.error.issues.map((i) => i.message).join(', '));
        }
        const body = UpdateProductSchema.safeParse(req.body);
        if (!body.success) {
          throw new ValidationError(body.error.issues.map((i) => i.message).join(', '));
        }
        return this.updateProductUseCase.execute({
          companyId: req.companyId,
          id: params.data.id,
          ...body.data,
        });
      },
      (result) => ({ status: 200, body: result }),
      (error: ErrorResponse) => ({ status: error.status, body: { error: error.message } }),
    );
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
        const { page, limit, isActive, name, categoryId, minStock, maxStock, ...rest } =
          parsed.data;

        return this.listProductsUseCase.execute({
          companyId: req.companyId,
          page,
          limit,
          filter: {
            isActive,
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

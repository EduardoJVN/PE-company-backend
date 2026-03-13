import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductController } from '@infra/products/entry-points/product.controller.js';
import type { CreateProductUseCase } from '@application/products/create-product.use-case.js';
import type { GetProductUseCase } from '@application/products/get-product.use-case.js';
import type { UpdateProductUseCase } from '@application/products/update-product.use-case.js';
import type { DeleteProductUseCase } from '@application/products/delete-product.use-case.js';
import type { ListProductsUseCase } from '@application/products/list-products.use-case.js';
import type { ProductResult } from '@domain/products/ports/product-repository.port.js';
import type { CompanyContextRequest } from '@infra/entry-points/base.controller.js';
import { CompanyMemberRoleId } from '@domain/catalog-ids.js';
import { DuplicateSkuError } from '@domain/products/errors/duplicate-sku.error.js';
import { InvalidProductNameError } from '@domain/products/errors/invalid-product-name.error.js';
import { ProductNotFoundError } from '@domain/products/errors/product-not-found.error.js';

const mockProductResult: ProductResult = {
  id: 'prod-uuid',
  companyId: 'company-uuid',
  name: 'Laptop Pro',
  sku: 'LAP-001',
  categoryId: 1,
  description: null,
  price: 1200,
  stockCurrent: 5,
  stockMinimum: 2,
  isActive: true,
  specs: {},
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const validBody = {
  name: 'Laptop Pro',
  sku: 'LAP-001',
  categoryId: 1,
  price: 1200,
  stockCurrent: 5,
  stockMinimum: 2,
};

function makeRequest(body: unknown, params: Record<string, string> = {}): CompanyContextRequest {
  return {
    body,
    params,
    query: {},
    userId: 'user-uuid',
    companyId: 'company-uuid',
    companyRoleId: CompanyMemberRoleId.ADMIN,
  };
}

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('ProductController.getById', () => {
  let mockGetUseCase: GetProductUseCase;
  let controller: ProductController;

  beforeEach(() => {
    mockGetUseCase = {
      execute: vi.fn().mockResolvedValue(mockProductResult),
    } as unknown as GetProductUseCase;
    controller = new ProductController(
      { execute: vi.fn() } as unknown as CreateProductUseCase,
      { execute: vi.fn() } as unknown as ListProductsUseCase,
      mockGetUseCase,
      { execute: vi.fn() } as unknown as UpdateProductUseCase,
      { execute: vi.fn() } as unknown as DeleteProductUseCase,
    );
  });

  it('returns 200 with the product', async () => {
    const result = await controller.getById(makeRequest({}, { id: VALID_UUID }));
    expect(result.status).toBe(200);
    expect(result.body).toEqual(mockProductResult);
  });

  it('calls use case with companyId and id from request', async () => {
    await controller.getById(makeRequest({}, { id: VALID_UUID }));
    expect(mockGetUseCase.execute).toHaveBeenCalledWith({
      companyId: 'company-uuid',
      id: VALID_UUID,
    });
  });

  it('returns 400 for invalid UUID param', async () => {
    const result = await controller.getById(makeRequest({}, { id: 'not-a-uuid' }));
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ error: expect.any(String) });
  });

  it('returns 404 when product is not found', async () => {
    vi.mocked(mockGetUseCase.execute).mockRejectedValue(new ProductNotFoundError(VALID_UUID));
    const result = await controller.getById(makeRequest({}, { id: VALID_UUID }));
    expect(result.status).toBe(404);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(mockGetUseCase.execute).mockRejectedValue(new Error('DB is on fire'));
    const result = await controller.getById(makeRequest({}, { id: VALID_UUID }));
    expect(result.status).toBe(500);
  });
});

describe('ProductController.create', () => {
  let mockUseCase: CreateProductUseCase;
  let controller: ProductController;

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn().mockResolvedValue(mockProductResult),
    } as unknown as CreateProductUseCase;
    controller = new ProductController(
      mockUseCase,
      { execute: vi.fn() } as unknown as ListProductsUseCase,
      { execute: vi.fn() } as unknown as GetProductUseCase,
      { execute: vi.fn() } as unknown as UpdateProductUseCase,
      { execute: vi.fn() } as unknown as DeleteProductUseCase,
    );
  });

  it('returns 201 with the created product', async () => {
    const result = await controller.create(makeRequest(validBody));
    expect(result.status).toBe(201);
    expect(result.body).toEqual(mockProductResult);
  });

  it('calls use case with companyId from context', async () => {
    await controller.create(makeRequest(validBody));
    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'company-uuid' }),
    );
  });

  it('returns 400 for invalid body (missing required fields)', async () => {
    const result = await controller.create(makeRequest({ name: 'Laptop' }));
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ error: expect.any(String) });
  });

  it('returns 400 when DuplicateSkuError is thrown', async () => {
    vi.mocked(mockUseCase.execute).mockRejectedValue(new DuplicateSkuError('LAP-001'));
    const result = await controller.create(makeRequest(validBody));
    expect(result.status).toBe(400);
  });

  it('returns 400 when InvalidProductNameError is thrown', async () => {
    vi.mocked(mockUseCase.execute).mockRejectedValue(new InvalidProductNameError());
    const result = await controller.create(makeRequest(validBody));
    expect(result.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(mockUseCase.execute).mockRejectedValue(new Error('DB is on fire'));
    const result = await controller.create(makeRequest(validBody));
    expect(result.status).toBe(500);
  });
});

describe('ProductController.update', () => {
  let mockUpdateUseCase: UpdateProductUseCase;
  let controller: ProductController;

  beforeEach(() => {
    mockUpdateUseCase = {
      execute: vi.fn().mockResolvedValue(mockProductResult),
    } as unknown as UpdateProductUseCase;
    controller = new ProductController(
      { execute: vi.fn() } as unknown as CreateProductUseCase,
      { execute: vi.fn() } as unknown as ListProductsUseCase,
      { execute: vi.fn() } as unknown as GetProductUseCase,
      mockUpdateUseCase,
      { execute: vi.fn() } as unknown as DeleteProductUseCase,
    );
  });

  it('returns 200 with the updated product', async () => {
    const result = await controller.update(makeRequest({ name: 'New Name' }, { id: VALID_UUID }));
    expect(result.status).toBe(200);
    expect(result.body).toEqual(mockProductResult);
  });

  it('calls use case with companyId and id from request', async () => {
    await controller.update(makeRequest({ price: 999 }, { id: VALID_UUID }));
    expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'company-uuid', id: VALID_UUID, price: 999 }),
    );
  });

  it('returns 400 for invalid UUID param', async () => {
    const result = await controller.update(makeRequest({ name: 'X' }, { id: 'not-a-uuid' }));
    expect(result.status).toBe(400);
  });

  it('returns 400 when body is empty', async () => {
    const result = await controller.update(makeRequest({}, { id: VALID_UUID }));
    expect(result.status).toBe(400);
  });

  it('returns 404 when product is not found', async () => {
    vi.mocked(mockUpdateUseCase.execute).mockRejectedValue(new ProductNotFoundError(VALID_UUID));
    const result = await controller.update(makeRequest({ name: 'X' }, { id: VALID_UUID }));
    expect(result.status).toBe(404);
  });

  it('returns 400 when DuplicateSkuError is thrown', async () => {
    vi.mocked(mockUpdateUseCase.execute).mockRejectedValue(new DuplicateSkuError('SKU-X'));
    const result = await controller.update(makeRequest({ sku: 'SKU-X' }, { id: VALID_UUID }));
    expect(result.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(mockUpdateUseCase.execute).mockRejectedValue(new Error('DB is on fire'));
    const result = await controller.update(makeRequest({ name: 'X' }, { id: VALID_UUID }));
    expect(result.status).toBe(500);
  });
});

describe('ProductController.delete', () => {
  let mockDeleteUseCase: DeleteProductUseCase;
  let controller: ProductController;

  beforeEach(() => {
    mockDeleteUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as DeleteProductUseCase;
    controller = new ProductController(
      { execute: vi.fn() } as unknown as CreateProductUseCase,
      { execute: vi.fn() } as unknown as ListProductsUseCase,
      { execute: vi.fn() } as unknown as GetProductUseCase,
      { execute: vi.fn() } as unknown as UpdateProductUseCase,
      mockDeleteUseCase,
    );
  });

  it('returns 204 on successful delete', async () => {
    const result = await controller.delete(makeRequest({}, { id: VALID_UUID }));
    expect(result.status).toBe(204);
    expect(result.body).toBeNull();
  });

  it('calls use case with companyId and id', async () => {
    await controller.delete(makeRequest({}, { id: VALID_UUID }));
    expect(mockDeleteUseCase.execute).toHaveBeenCalledWith({
      companyId: 'company-uuid',
      id: VALID_UUID,
    });
  });

  it('returns 400 for invalid UUID param', async () => {
    const result = await controller.delete(makeRequest({}, { id: 'not-a-uuid' }));
    expect(result.status).toBe(400);
  });

  it('returns 404 when product is not found', async () => {
    vi.mocked(mockDeleteUseCase.execute).mockRejectedValue(new ProductNotFoundError(VALID_UUID));
    const result = await controller.delete(makeRequest({}, { id: VALID_UUID }));
    expect(result.status).toBe(404);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(mockDeleteUseCase.execute).mockRejectedValue(new Error('DB is on fire'));
    const result = await controller.delete(makeRequest({}, { id: VALID_UUID }));
    expect(result.status).toBe(500);
  });
});

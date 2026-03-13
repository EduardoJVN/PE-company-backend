import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductController } from '@infra/products/entry-points/product.controller.js';
import type { CreateProductUseCase } from '@application/products/create-product.use-case.js';
import type { ProductResult } from '@domain/products/ports/product-repository.port.js';
import type { CompanyContextRequest } from '@infra/entry-points/base.controller.js';
import { CompanyMemberRoleId } from '@domain/catalog-ids.js';
import { DuplicateSkuError } from '@domain/products/errors/duplicate-sku.error.js';
import { InvalidProductNameError } from '@domain/products/errors/invalid-product-name.error.js';

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

function makeRequest(body: unknown): CompanyContextRequest {
  return {
    body,
    params: {},
    query: {},
    userId: 'user-uuid',
    companyId: 'company-uuid',
    companyRoleId: CompanyMemberRoleId.ADMIN,
  };
}

describe('ProductController.create', () => {
  let mockUseCase: CreateProductUseCase;
  let controller: ProductController;

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn().mockResolvedValue(mockProductResult),
    } as unknown as CreateProductUseCase;
    controller = new ProductController(mockUseCase);
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

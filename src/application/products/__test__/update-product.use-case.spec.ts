import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateProductUseCase } from '@application/products/update-product.use-case.js';
import type {
  IProductRepository,
  ProductResult,
  ListProductsFilter,
} from '@domain/products/ports/product-repository.port.js';
import type { Product } from '@domain/products/entities/product.entity.js';
import type { StockMovement } from '@domain/products/entities/stock-movement.entity.js';
import { ProductNotFoundError } from '@domain/products/errors/product-not-found.error.js';
import { DuplicateSkuError } from '@domain/products/errors/duplicate-sku.error.js';
import { InvalidProductPriceError } from '@domain/products/errors/invalid-product-price.error.js';

const makeProduct = (overrides: Partial<ProductResult> = {}): ProductResult => ({
  id: 'prod-1',
  companyId: 'company-1',
  name: 'Laptop Pro',
  sku: 'LAP-001',
  categoryId: 1,
  description: null,
  price: 1200,
  stockCurrent: 10,
  stockMinimum: 2,
  isActive: true,
  specs: {},
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

class MockProductRepository implements IProductRepository {
  private store: Map<string, ProductResult> = new Map();
  private skus: Set<string> = new Set();

  async save(_p: Product): Promise<ProductResult> {
    return makeProduct();
  }
  async saveWithInitialMovement(_p: Product, _m: StockMovement): Promise<ProductResult> {
    return makeProduct();
  }
  async existsBySku(_c: string, sku: string): Promise<boolean> {
    return this.skus.has(sku);
  }
  async findAll(
    _c: string,
    _f: ListProductsFilter,
    _l: number | undefined,
    _o: number | undefined,
  ): Promise<{ data: ProductResult[]; total: number }> {
    return { data: [], total: 0 };
  }
  async findById(companyId: string, id: string): Promise<ProductResult | null> {
    const p = this.store.get(id);
    if (!p || p.companyId !== companyId) return null;
    return p;
  }
  async update(product: Product): Promise<ProductResult> {
    const result = makeProduct({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      stockMinimum: product.stockMinimum,
    });
    this.store.set(product.id, result);
    return result;
  }
  async deactivate(_p: Product): Promise<void> {}

  seed(product: ProductResult) {
    this.store.set(product.id, product);
  }
  seedSku(sku: string) {
    this.skus.add(sku);
  }
}

describe('UpdateProductUseCase', () => {
  let repo: MockProductRepository;
  let useCase: UpdateProductUseCase;

  beforeEach(() => {
    repo = new MockProductRepository();
    useCase = new UpdateProductUseCase(repo);
  });

  it('updates and returns the product', async () => {
    repo.seed(makeProduct());

    const result = await useCase.execute({
      companyId: 'company-1',
      id: 'prod-1',
      name: 'Gaming Laptop',
      price: 1500,
    });

    expect(result.name).toBe('Gaming Laptop');
    expect(result.price).toBe(1500);
  });

  it('throws ProductNotFoundError when product does not exist', async () => {
    await expect(
      useCase.execute({ companyId: 'company-1', id: 'nonexistent', name: 'X' }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('throws ProductNotFoundError when product is inactive', async () => {
    repo.seed(makeProduct({ isActive: false }));

    await expect(
      useCase.execute({ companyId: 'company-1', id: 'prod-1', name: 'X' }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('throws DuplicateSkuError when new SKU already exists', async () => {
    repo.seed(makeProduct());
    repo.seedSku('TAKEN-SKU');

    await expect(
      useCase.execute({ companyId: 'company-1', id: 'prod-1', sku: 'TAKEN-SKU' }),
    ).rejects.toThrow(DuplicateSkuError);
  });

  it('does not check duplicate SKU when SKU is unchanged', async () => {
    repo.seed(makeProduct());
    repo.seedSku('LAP-001'); // same as current — should not throw

    await expect(
      useCase.execute({ companyId: 'company-1', id: 'prod-1', sku: 'LAP-001' }),
    ).resolves.toBeDefined();
  });

  it('bubbles up domain validation errors', async () => {
    repo.seed(makeProduct());

    await expect(
      useCase.execute({ companyId: 'company-1', id: 'prod-1', price: -1 }),
    ).rejects.toThrow(InvalidProductPriceError);
  });
});

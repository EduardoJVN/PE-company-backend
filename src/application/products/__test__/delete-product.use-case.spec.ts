import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteProductUseCase } from '@application/products/delete-product.use-case.js';
import type {
  IProductRepository,
  ProductResult,
  ListProductsFilter,
} from '@domain/products/ports/product-repository.port.js';
import type { Product } from '@domain/products/entities/product.entity.js';
import type { StockMovement } from '@domain/products/entities/stock-movement.entity.js';
import { ProductNotFoundError } from '@domain/products/errors/product-not-found.error.js';

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
  deactivate = vi.fn().mockResolvedValue(undefined);

  async save(_p: Product): Promise<ProductResult> {
    return makeProduct();
  }
  async saveWithInitialMovement(_p: Product, _m: StockMovement): Promise<ProductResult> {
    return makeProduct();
  }
  async existsBySku(_c: string, _s: string): Promise<boolean> {
    return false;
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
  async update(_p: Product): Promise<ProductResult> {
    return makeProduct();
  }

  seed(product: ProductResult) {
    this.store.set(product.id, product);
  }
}

describe('DeleteProductUseCase', () => {
  let repo: MockProductRepository;
  let useCase: DeleteProductUseCase;

  beforeEach(() => {
    repo = new MockProductRepository();
    useCase = new DeleteProductUseCase(repo);
  });

  it('deactivates the product', async () => {
    repo.seed(makeProduct());

    await useCase.execute({ companyId: 'company-1', id: 'prod-1' });

    expect(repo.deactivate).toHaveBeenCalledOnce();
    const deactivated = repo.deactivate.mock.calls[0][0] as Product;
    expect(deactivated.isActive).toBe(false);
  });

  it('throws ProductNotFoundError when product does not exist', async () => {
    await expect(useCase.execute({ companyId: 'company-1', id: 'nonexistent' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('throws ProductNotFoundError when product is already inactive', async () => {
    repo.seed(makeProduct({ isActive: false }));

    await expect(useCase.execute({ companyId: 'company-1', id: 'prod-1' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('throws ProductNotFoundError when product belongs to a different company', async () => {
    repo.seed(makeProduct());

    await expect(useCase.execute({ companyId: 'other-company', id: 'prod-1' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });
});

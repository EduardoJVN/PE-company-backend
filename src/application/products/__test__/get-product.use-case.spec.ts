import { describe, it, expect, beforeEach } from 'vitest';
import { GetProductUseCase } from '@application/products/get-product.use-case.js';
import type {
  IProductRepository,
  ProductResult,
  ListProductsFilter,
} from '@domain/products/ports/product-repository.port.js';
import type { Product } from '@domain/products/entities/product.entity.js';
import type { StockMovement } from '@domain/products/entities/stock-movement.entity.js';
import { ProductNotFoundError } from '@domain/products/errors/product-not-found.error.js';

const makeProduct = (id: string, companyId = 'company-1', isActive = true): ProductResult => ({
  id,
  companyId,
  name: 'Laptop Pro',
  sku: 'LAP-001',
  categoryId: 1,
  description: null,
  price: 1200,
  stockCurrent: 5,
  stockMinimum: 2,
  isActive,
  specs: {},
  createdAt: new Date(),
  updatedAt: new Date(),
});

class MockProductRepository implements IProductRepository {
  private store: Map<string, ProductResult> = new Map();

  async save(_p: Product): Promise<ProductResult> {
    return makeProduct('x');
  }
  async saveWithInitialMovement(_p: Product, _m: StockMovement): Promise<ProductResult> {
    return makeProduct('x');
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
  async update(_p: Product): Promise<ProductResult> {
    return makeProduct('x');
  }
  async findById(companyId: string, id: string): Promise<ProductResult | null> {
    const product = this.store.get(id);
    if (!product || product.companyId !== companyId) return null;
    return product;
  }

  seed(product: ProductResult) {
    this.store.set(product.id, product);
  }
}

describe('GetProductUseCase', () => {
  let repo: MockProductRepository;
  let useCase: GetProductUseCase;

  beforeEach(() => {
    repo = new MockProductRepository();
    useCase = new GetProductUseCase(repo);
  });

  it('returns the product when found', async () => {
    const product = makeProduct('prod-1');
    repo.seed(product);

    const result = await useCase.execute({ companyId: 'company-1', id: 'prod-1' });

    expect(result).toEqual(product);
  });

  it('throws ProductNotFoundError when product does not exist', async () => {
    await expect(useCase.execute({ companyId: 'company-1', id: 'nonexistent' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('throws ProductNotFoundError when product belongs to a different company', async () => {
    const product = makeProduct('prod-1', 'company-1');
    repo.seed(product);

    await expect(useCase.execute({ companyId: 'other-company', id: 'prod-1' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('throws ProductNotFoundError when product is inactive', async () => {
    const product = makeProduct('prod-1', 'company-1', false);
    repo.seed(product);

    await expect(useCase.execute({ companyId: 'company-1', id: 'prod-1' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });
});

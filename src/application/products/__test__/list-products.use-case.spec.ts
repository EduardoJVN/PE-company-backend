import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListProductsUseCase } from '@application/products/list-products.use-case.js';
import type {
  IProductRepository,
  ProductResult,
  ListProductsFilter,
} from '@domain/products/ports/product-repository.port.js';
import type { Product } from '@domain/products/entities/product.entity.js';
import type { StockMovement } from '@domain/products/entities/stock-movement.entity.js';

const makeProduct = (id: string): ProductResult => ({
  id,
  companyId: 'company-1',
  name: `Product ${id}`,
  sku: `SKU-${id}`,
  categoryId: 1,
  description: null,
  price: 100,
  stockCurrent: 10,
  stockMinimum: 2,
  isActive: true,
  specs: {},
  createdAt: new Date(),
  updatedAt: new Date(),
});

class MockProductRepository implements IProductRepository {
  private store: ProductResult[] = [];

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
    _companyId: string,
    _filter: ListProductsFilter,
    limit: number,
    offset: number,
  ): Promise<{ data: ProductResult[]; total: number }> {
    const slice = this.store.slice(offset, offset + limit);
    return { data: slice, total: this.store.length };
  }

  seed(items: ProductResult[]) {
    this.store = items;
  }
}

describe('ListProductsUseCase', () => {
  let repo: MockProductRepository;
  let useCase: ListProductsUseCase;

  beforeEach(() => {
    repo = new MockProductRepository();
    useCase = new ListProductsUseCase(repo);
  });

  it('returns paginated result with correct metadata', async () => {
    repo.seed(Array.from({ length: 45 }, (_, i) => makeProduct(`p${i}`)));

    const result = await useCase.execute({
      companyId: 'company-1',
      filter: {},
      page: 2,
      limit: 20,
    });

    expect(result.data).toHaveLength(20);
    expect(result.total).toBe(45);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(3);
  });

  it('returns empty result when no products', async () => {
    const result = await useCase.execute({
      companyId: 'company-1',
      filter: {},
      page: 1,
      limit: 20,
    });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('passes filter and companyId to repository', async () => {
    const spy = vi.spyOn(repo, 'findAll');
    const filter = { name: 'laptop', categoryId: 3 };

    await useCase.execute({ companyId: 'company-1', filter, page: 1, limit: 10 });

    expect(spy).toHaveBeenCalledWith('company-1', filter, 10, 0);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateProductUseCase } from '@application/products/create-product.use-case.js';
import type {
  IProductRepository,
  ProductResult,
} from '@domain/products/ports/product-repository.port.js';
import type { Product } from '@domain/products/entities/product.entity.js';
import type { StockMovement } from '@domain/products/entities/stock-movement.entity.js';
import { StockMovementType } from '@domain/catalog-ids.js';
import { DuplicateSkuError } from '@domain/products/errors/duplicate-sku.error.js';
import { InvalidProductNameError } from '@domain/products/errors/invalid-product-name.error.js';
import { InvalidProductSkuError } from '@domain/products/errors/invalid-product-sku.error.js';
import { InvalidProductPriceError } from '@domain/products/errors/invalid-product-price.error.js';

class MockProductRepository implements IProductRepository {
  private skus = new Set<string>();
  savedProducts: Product[] = [];
  savedMovements: StockMovement[] = [];

  async existsBySku(_companyId: string, sku: string): Promise<boolean> {
    return this.skus.has(sku);
  }

  async save(product: Product): Promise<ProductResult> {
    this.savedProducts.push(product);
    return toResult(product);
  }

  async saveWithInitialMovement(product: Product, movement: StockMovement): Promise<ProductResult> {
    this.savedProducts.push(product);
    this.savedMovements.push(movement);
    return toResult(product);
  }

  seedSku(sku: string) {
    this.skus.add(sku);
  }
}

function toResult(product: Product): ProductResult {
  return {
    id: product.id,
    companyId: product.companyId,
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId,
    description: product.description,
    price: product.price,
    stockCurrent: product.stockCurrent,
    stockMinimum: product.stockMinimum,
    isActive: product.isActive,
    specs: product.specs,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

const BASE_INPUT = {
  companyId: 'company-1',
  createdBy: 'user-1',
  name: 'Laptop Pro',
  sku: 'LAP-001',
  categoryId: 1,
  price: 1200,
  stockCurrent: 5,
  stockMinimum: 2,
};

describe('CreateProductUseCase', () => {
  let repo: MockProductRepository;
  let useCase: CreateProductUseCase;

  beforeEach(() => {
    repo = new MockProductRepository();
    useCase = new CreateProductUseCase(repo);
  });

  it('creates product and initial IN movement when stockCurrent > 0', async () => {
    const result = await useCase.execute(BASE_INPUT);

    expect(result.name).toBe(BASE_INPUT.name);
    expect(repo.savedProducts).toHaveLength(1);
    expect(repo.savedMovements).toHaveLength(1);
    expect(repo.savedMovements[0]?.type).toBe(StockMovementType.IN);
    expect(repo.savedMovements[0]?.quantity).toBe(BASE_INPUT.stockCurrent);
    expect(repo.savedMovements[0]?.createdBy).toBe(BASE_INPUT.createdBy);
  });

  it('creates product without movement when stockCurrent = 0', async () => {
    await useCase.execute({ ...BASE_INPUT, stockCurrent: 0, stockMinimum: 0 });

    expect(repo.savedProducts).toHaveLength(1);
    expect(repo.savedMovements).toHaveLength(0);
  });

  it('generates unique ids for product and movement', async () => {
    const a = await useCase.execute({ ...BASE_INPUT, sku: 'SKU-A' });
    const b = await useCase.execute({ ...BASE_INPUT, sku: 'SKU-B' });
    expect(a.id).not.toBe(b.id);
    expect(repo.savedMovements[0]?.id).not.toBe(repo.savedMovements[1]?.id);
  });

  it('movement productId matches product id', async () => {
    await useCase.execute(BASE_INPUT);
    expect(repo.savedMovements[0]?.productId).toBe(repo.savedProducts[0]?.id);
  });

  it('throws DuplicateSkuError when SKU already exists for the company', async () => {
    repo.seedSku(BASE_INPUT.sku);
    await expect(useCase.execute(BASE_INPUT)).rejects.toThrow(DuplicateSkuError);
  });

  it('throws InvalidProductNameError for empty name', async () => {
    await expect(useCase.execute({ ...BASE_INPUT, name: '  ' })).rejects.toThrow(
      InvalidProductNameError,
    );
  });

  it('throws InvalidProductSkuError for empty sku', async () => {
    await expect(useCase.execute({ ...BASE_INPUT, sku: '' })).rejects.toThrow(
      InvalidProductSkuError,
    );
  });

  it('throws InvalidProductPriceError for negative price', async () => {
    await expect(useCase.execute({ ...BASE_INPUT, price: -5 })).rejects.toThrow(
      InvalidProductPriceError,
    );
  });
});

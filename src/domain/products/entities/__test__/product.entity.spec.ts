import { describe, it, expect } from 'vitest';
import { Product } from '@domain/products/entities/product.entity.js';
import { InvalidProductNameError } from '@domain/products/errors/invalid-product-name.error.js';
import { InvalidProductSkuError } from '@domain/products/errors/invalid-product-sku.error.js';
import { InvalidProductPriceError } from '@domain/products/errors/invalid-product-price.error.js';
import { InvalidStockMinimumError } from '@domain/products/errors/invalid-stock-minimum.error.js';
import { StockCurrentBelowMinimumError } from '@domain/products/errors/stock-current-below-minimum.error.js';

const BASE = {
  id: 'prod-1',
  companyId: 'company-1',
  name: 'Laptop',
  sku: 'LAP-001',
  categoryId: 1,
  price: 999.99,
  stockCurrent: 10,
  stockMinimum: 2,
};

describe('Product.create', () => {
  it('creates a product with valid data', () => {
    const product = Product.create(
      BASE.id,
      BASE.companyId,
      BASE.name,
      BASE.sku,
      BASE.categoryId,
      BASE.price,
      BASE.stockCurrent,
      BASE.stockMinimum,
    );

    expect(product.id).toBe(BASE.id);
    expect(product.companyId).toBe(BASE.companyId);
    expect(product.name).toBe(BASE.name);
    expect(product.sku).toBe(BASE.sku);
    expect(product.price).toBe(BASE.price);
    expect(product.stockCurrent).toBe(BASE.stockCurrent);
    expect(product.stockMinimum).toBe(BASE.stockMinimum);
    expect(product.isActive).toBe(true);
    expect(product.specs).toEqual({});
    expect(product.description).toBeNull();
  });

  it('trims name and sku', () => {
    const product = Product.create(
      BASE.id,
      BASE.companyId,
      '  Laptop  ',
      '  LAP-001  ',
      BASE.categoryId,
      BASE.price,
      BASE.stockCurrent,
      BASE.stockMinimum,
    );
    expect(product.name).toBe('Laptop');
    expect(product.sku).toBe('LAP-001');
  });

  it('accepts description and specs', () => {
    const specs = { ram: '16GB', storage: '512GB' };
    const product = Product.create(
      BASE.id,
      BASE.companyId,
      BASE.name,
      BASE.sku,
      BASE.categoryId,
      BASE.price,
      BASE.stockCurrent,
      BASE.stockMinimum,
      'A great laptop',
      specs,
    );
    expect(product.description).toBe('A great laptop');
    expect(product.specs).toEqual(specs);
  });

  it('accepts price = 0', () => {
    expect(() =>
      Product.create(BASE.id, BASE.companyId, BASE.name, BASE.sku, BASE.categoryId, 0, 5, 0),
    ).not.toThrow();
  });

  it('accepts stockMinimum = 0', () => {
    expect(() =>
      Product.create(BASE.id, BASE.companyId, BASE.name, BASE.sku, BASE.categoryId, 10, 5, 0),
    ).not.toThrow();
  });

  it('throws InvalidProductNameError for empty name', () => {
    expect(() =>
      Product.create(
        BASE.id,
        BASE.companyId,
        '   ',
        BASE.sku,
        BASE.categoryId,
        BASE.price,
        BASE.stockCurrent,
        BASE.stockMinimum,
      ),
    ).toThrow(InvalidProductNameError);
  });

  it('throws InvalidProductSkuError for empty sku', () => {
    expect(() =>
      Product.create(
        BASE.id,
        BASE.companyId,
        BASE.name,
        '  ',
        BASE.categoryId,
        BASE.price,
        BASE.stockCurrent,
        BASE.stockMinimum,
      ),
    ).toThrow(InvalidProductSkuError);
  });

  it('throws InvalidProductPriceError for negative price', () => {
    expect(() =>
      Product.create(
        BASE.id,
        BASE.companyId,
        BASE.name,
        BASE.sku,
        BASE.categoryId,
        -1,
        BASE.stockCurrent,
        BASE.stockMinimum,
      ),
    ).toThrow(InvalidProductPriceError);
  });

  it('throws InvalidStockMinimumError for negative stockMinimum', () => {
    expect(() =>
      Product.create(
        BASE.id,
        BASE.companyId,
        BASE.name,
        BASE.sku,
        BASE.categoryId,
        BASE.price,
        BASE.stockCurrent,
        -1,
      ),
    ).toThrow(InvalidStockMinimumError);
  });

  it('throws StockCurrentBelowMinimumError when stockCurrent < stockMinimum', () => {
    expect(() =>
      Product.create(
        BASE.id,
        BASE.companyId,
        BASE.name,
        BASE.sku,
        BASE.categoryId,
        BASE.price,
        1,
        5,
      ),
    ).toThrow(StockCurrentBelowMinimumError);
  });

  it('allows stockCurrent === stockMinimum', () => {
    expect(() =>
      Product.create(
        BASE.id,
        BASE.companyId,
        BASE.name,
        BASE.sku,
        BASE.categoryId,
        BASE.price,
        0,
        0,
      ),
    ).not.toThrow();
  });
});

describe('Product.update', () => {
  const base = Product.create(
    BASE.id,
    BASE.companyId,
    BASE.name,
    BASE.sku,
    BASE.categoryId,
    BASE.price,
    BASE.stockCurrent,
    BASE.stockMinimum,
  );

  it('returns a new instance with updated fields', () => {
    const updated = base.update({ name: 'Laptop Pro', price: 1200 });
    expect(updated.name).toBe('Laptop Pro');
    expect(updated.price).toBe(1200);
    expect(updated.sku).toBe(BASE.sku);
  });

  it('preserves unchanged fields', () => {
    const updated = base.update({ name: 'New Name' });
    expect(updated.id).toBe(base.id);
    expect(updated.companyId).toBe(base.companyId);
    expect(updated.stockCurrent).toBe(base.stockCurrent);
    expect(updated.isActive).toBe(base.isActive);
    expect(updated.createdAt).toBe(base.createdAt);
  });

  it('updates updatedAt', () => {
    const before = base.updatedAt;
    const updated = base.update({ name: 'New' });
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('allows setting description to null', () => {
    const updated = base.update({ description: null });
    expect(updated.description).toBeNull();
  });

  it('throws InvalidProductNameError for empty name', () => {
    expect(() => base.update({ name: '  ' })).toThrow(InvalidProductNameError);
  });

  it('throws InvalidProductSkuError for empty sku', () => {
    expect(() => base.update({ sku: '' })).toThrow(InvalidProductSkuError);
  });

  it('throws InvalidProductPriceError for negative price', () => {
    expect(() => base.update({ price: -1 })).toThrow(InvalidProductPriceError);
  });

  it('throws InvalidStockMinimumError for negative stockMinimum', () => {
    expect(() => base.update({ stockMinimum: -1 })).toThrow(InvalidStockMinimumError);
  });

  it('throws StockCurrentBelowMinimumError when new stockMinimum exceeds stockCurrent', () => {
    // BASE.stockCurrent = 10, so stockMinimum > 10 should fail
    expect(() => base.update({ stockMinimum: 11 })).toThrow(StockCurrentBelowMinimumError);
  });
});

describe('Product.reconstitute', () => {
  it('reconstitutes without validation', () => {
    const now = new Date();
    const product = Product.reconstitute(
      BASE.id,
      BASE.companyId,
      BASE.name,
      BASE.sku,
      BASE.categoryId,
      'desc',
      BASE.price,
      BASE.stockCurrent,
      BASE.stockMinimum,
      false,
      { ram: '8GB' },
      now,
      now,
    );
    expect(product.isActive).toBe(false);
    expect(product.specs).toEqual({ ram: '8GB' });
  });
});

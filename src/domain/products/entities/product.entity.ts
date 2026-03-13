import { InvalidProductNameError } from '@domain/products/errors/invalid-product-name.error.js';
import { InvalidProductPriceError } from '@domain/products/errors/invalid-product-price.error.js';
import { InvalidProductSkuError } from '@domain/products/errors/invalid-product-sku.error.js';
import { InvalidStockMinimumError } from '@domain/products/errors/invalid-stock-minimum.error.js';
import { StockCurrentBelowMinimumError } from '@domain/products/errors/stock-current-below-minimum.error.js';

export class Product {
  private constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name: string,
    public readonly sku: string,
    public readonly categoryId: number,
    public readonly description: string | null,
    public readonly price: number,
    public readonly stockCurrent: number,
    public readonly stockMinimum: number,
    public readonly isActive: boolean,
    public readonly specs: Record<string, unknown>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    companyId: string,
    name: string,
    sku: string,
    categoryId: number,
    price: number,
    stockCurrent: number,
    stockMinimum: number,
    description?: string,
    specs?: Record<string, unknown>,
  ): Product {
    if (name.trim() === '') throw new InvalidProductNameError();
    if (sku.trim() === '') throw new InvalidProductSkuError();
    if (price < 0) throw new InvalidProductPriceError(price);
    if (stockMinimum < 0) throw new InvalidStockMinimumError(stockMinimum);
    if (stockCurrent < stockMinimum)
      throw new StockCurrentBelowMinimumError(stockCurrent, stockMinimum);

    const now = new Date();
    return new Product(
      id,
      companyId,
      name.trim(),
      sku.trim(),
      categoryId,
      description ?? null,
      price,
      stockCurrent,
      stockMinimum,
      true,
      specs ?? {},
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    companyId: string,
    name: string,
    sku: string,
    categoryId: number,
    description: string | null,
    price: number,
    stockCurrent: number,
    stockMinimum: number,
    isActive: boolean,
    specs: Record<string, unknown>,
    createdAt: Date,
    updatedAt: Date,
  ): Product {
    return new Product(
      id,
      companyId,
      name,
      sku,
      categoryId,
      description,
      price,
      stockCurrent,
      stockMinimum,
      isActive,
      specs,
      createdAt,
      updatedAt,
    );
  }
}

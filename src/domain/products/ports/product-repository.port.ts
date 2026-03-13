import type { StockMovementType } from '@domain/catalog-ids.js';
import type { Product } from '@domain/products/entities/product.entity.js';
import type { StockMovement } from '@domain/products/entities/stock-movement.entity.js';

export interface ProductResult {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  categoryId: number;
  description: string | null;
  price: number;
  stockCurrent: number;
  stockMinimum: number;
  isActive: boolean;
  specs: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovementResult {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  note: string | null;
  referenceId: string | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface ListProductsFilter {
  isActive?: boolean;
  name?: string;
  categoryId?: number;
  minStock?: number;
  maxStock?: number;
  specs?: Record<string, string>;
}

export interface IProductRepository {
  save(product: Product): Promise<ProductResult>;
  saveWithInitialMovement(product: Product, movement: StockMovement): Promise<ProductResult>;
  existsBySku(companyId: string, sku: string): Promise<boolean>;
  findAll(
    companyId: string,
    filter: ListProductsFilter,
    limit: number | undefined,
    offset: number | undefined,
  ): Promise<{ data: ProductResult[]; total: number }>;
  findById(companyId: string, id: string): Promise<ProductResult | null>;
  update(product: Product): Promise<ProductResult>;
  deactivate(product: Product): Promise<void>;
}

import type { PrismaClient } from '@prisma/client';
import type { Product } from '@domain/products/entities/product.entity.js';
import type { StockMovement } from '@domain/products/entities/stock-movement.entity.js';
import type {
  IProductRepository,
  ProductResult,
} from '@domain/products/ports/product-repository.port.js';

const productSelect = {
  id: true,
  companyId: true,
  name: true,
  sku: true,
  categoryId: true,
  description: true,
  price: true,
  stockCurrent: true,
  stockMinimum: true,
  isActive: true,
  specs: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(product: Product): Promise<ProductResult> {
    const row = await this.db.product.create({
      data: this.toData(product),
      select: productSelect,
    });
    return this.toResult(row);
  }

  async saveWithInitialMovement(product: Product, movement: StockMovement): Promise<ProductResult> {
    const [row] = await this.db.$transaction([
      this.db.product.create({
        data: this.toData(product),
        select: productSelect,
      }),
      this.db.stockMovement.create({
        data: {
          id: movement.id,
          productId: movement.productId,
          type: movement.type,
          quantity: movement.quantity,
          note: movement.note,
          referenceId: movement.referenceId,
          createdBy: movement.createdBy,
        },
      }),
    ]);
    return this.toResult(row);
  }

  async existsBySku(companyId: string, sku: string): Promise<boolean> {
    const count = await this.db.product.count({ where: { companyId, sku, isActive: true } });
    return count > 0;
  }

  private toData(product: Product) {
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
    };
  }

  private toResult(row: {
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
    specs: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): ProductResult {
    return {
      id: row.id,
      companyId: row.companyId,
      name: row.name,
      sku: row.sku,
      categoryId: row.categoryId,
      description: row.description,
      price: row.price,
      stockCurrent: row.stockCurrent,
      stockMinimum: row.stockMinimum,
      isActive: row.isActive,
      specs: (row.specs as Record<string, unknown>) ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

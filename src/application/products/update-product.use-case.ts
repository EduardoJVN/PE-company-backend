import { Product } from '@domain/products/entities/product.entity.js';
import { ProductNotFoundError } from '@domain/products/errors/product-not-found.error.js';
import { DuplicateSkuError } from '@domain/products/errors/duplicate-sku.error.js';
import type {
  IProductRepository,
  ProductResult,
} from '@domain/products/ports/product-repository.port.js';

export interface UpdateProductInput {
  companyId: string;
  id: string;
  name?: string;
  sku?: string;
  categoryId?: number;
  description?: string | null;
  price?: number;
  stockMinimum?: number;
  specs?: Record<string, unknown>;
}

export class UpdateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(input: UpdateProductInput): Promise<ProductResult> {
    const existing = await this.productRepo.findById(input.companyId, input.id);
    if (!existing || !existing.isActive) throw new ProductNotFoundError(input.id);

    if (input.sku !== undefined && input.sku !== existing.sku) {
      const duplicate = await this.productRepo.existsBySku(input.companyId, input.sku);
      if (duplicate) throw new DuplicateSkuError(input.sku);
    }

    const product = Product.reconstitute(
      existing.id,
      existing.companyId,
      existing.name,
      existing.sku,
      existing.categoryId,
      existing.description,
      existing.price,
      existing.stockCurrent,
      existing.stockMinimum,
      existing.isActive,
      existing.specs,
      existing.createdAt,
      existing.updatedAt,
    );

    const updated = product.update({
      name: input.name,
      sku: input.sku,
      categoryId: input.categoryId,
      description: input.description,
      price: input.price,
      stockMinimum: input.stockMinimum,
      specs: input.specs,
    });

    return this.productRepo.update(updated);
  }
}

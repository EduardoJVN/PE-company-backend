import { Product } from '@domain/products/entities/product.entity.js';
import { ProductNotFoundError } from '@domain/products/errors/product-not-found.error.js';
import type { IProductRepository } from '@domain/products/ports/product-repository.port.js';

export interface DeleteProductInput {
  companyId: string;
  id: string;
}

export class DeleteProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(input: DeleteProductInput): Promise<void> {
    const existing = await this.productRepo.findById(input.companyId, input.id);
    if (!existing || !existing.isActive) throw new ProductNotFoundError(input.id);

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

    await this.productRepo.deactivate(product.deactivate());
  }
}

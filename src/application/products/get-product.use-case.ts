import type {
  IProductRepository,
  ProductResult,
} from '@domain/products/ports/product-repository.port.js';
import { ProductNotFoundError } from '@domain/products/errors/product-not-found.error.js';

export interface GetProductInput {
  companyId: string;
  id: string;
}

export class GetProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(input: GetProductInput): Promise<ProductResult> {
    const product = await this.productRepo.findById(input.companyId, input.id);
    if (!product || !product.isActive) throw new ProductNotFoundError(input.id);
    return product;
  }
}

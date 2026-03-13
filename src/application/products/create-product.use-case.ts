import { uuidv7 } from 'uuidv7';
import { StockMovementType } from '@domain/catalog-ids.js';
import { Product } from '@domain/products/entities/product.entity.js';
import { StockMovement } from '@domain/products/entities/stock-movement.entity.js';
import { DuplicateSkuError } from '@domain/products/errors/duplicate-sku.error.js';
import type {
  IProductRepository,
  ProductResult,
} from '@domain/products/ports/product-repository.port.js';

export interface CreateProductInput {
  companyId: string;
  createdBy: string;
  name: string;
  sku: string;
  categoryId: number;
  price: number;
  stockCurrent: number;
  stockMinimum: number;
  description?: string;
  specs?: Record<string, unknown>;
}

export class CreateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<ProductResult> {
    const skuExists = await this.productRepo.existsBySku(input.companyId, input.sku);
    if (skuExists) throw new DuplicateSkuError(input.sku);

    const product = Product.create(
      uuidv7(),
      input.companyId,
      input.name,
      input.sku,
      input.categoryId,
      input.price,
      input.stockCurrent,
      input.stockMinimum,
      input.description,
      input.specs,
    );

    if (input.stockCurrent > 0) {
      const movement = StockMovement.create(
        uuidv7(),
        product.id,
        StockMovementType.IN,
        input.stockCurrent,
        input.createdBy,
        'Initial stock',
      );
      return this.productRepo.saveWithInitialMovement(product, movement);
    }

    return this.productRepo.save(product);
  }
}

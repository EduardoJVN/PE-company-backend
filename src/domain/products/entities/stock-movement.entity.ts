import { StockMovementType } from '@domain/catalog-ids.js';
import { InvalidStockMovementQuantityError } from '@domain/products/errors/invalid-stock-movement-quantity.error.js';

export class StockMovement {
  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly type: StockMovementType,
    public readonly quantity: number,
    public readonly note: string | null,
    public readonly referenceId: string | null,
    public readonly createdBy: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    productId: string,
    type: StockMovementType,
    quantity: number,
    createdBy?: string,
    note?: string,
    referenceId?: string,
  ): StockMovement {
    if (quantity <= 0) throw new InvalidStockMovementQuantityError(quantity);

    return new StockMovement(
      id,
      productId,
      type,
      quantity,
      note ?? null,
      referenceId ?? null,
      createdBy ?? null,
      new Date(),
    );
  }
}

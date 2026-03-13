import { DomainError } from '@shared/errors/domain.error.js';

export class InvalidStockMovementQuantityError extends DomainError {
  constructor(quantity: number) {
    super(`Stock movement quantity must be > 0, got: ${quantity}`);
  }
}

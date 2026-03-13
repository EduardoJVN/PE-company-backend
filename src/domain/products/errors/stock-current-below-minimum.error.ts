import { DomainError } from '@shared/errors/domain.error.js';

export class StockCurrentBelowMinimumError extends DomainError {
  constructor(stockCurrent: number, stockMinimum: number) {
    super(`Stock current (${stockCurrent}) cannot be less than stock minimum (${stockMinimum})`);
  }
}

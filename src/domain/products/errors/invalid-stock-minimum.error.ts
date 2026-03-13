import { DomainError } from '@shared/errors/domain.error.js';

export class InvalidStockMinimumError extends DomainError {
  constructor(value: number) {
    super(`Stock minimum must be >= 0, got: ${value}`);
  }
}

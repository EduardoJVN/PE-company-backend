import { DomainError } from '@shared/errors/domain.error.js';

export class InvalidProductSkuError extends DomainError {
  constructor() {
    super('Product SKU cannot be empty');
  }
}

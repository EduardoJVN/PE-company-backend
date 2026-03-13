import { DomainError } from '@shared/errors/domain.error.js';

export class DuplicateSkuError extends DomainError {
  constructor(sku: string) {
    super(`SKU "${sku}" already exists in this company`);
  }
}

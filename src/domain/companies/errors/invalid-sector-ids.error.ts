import { DomainError } from '@shared/errors/domain.error.js';

export class InvalidSectorIdsError extends DomainError {
  constructor() {
    super('Company must have at least one sector');
  }
}

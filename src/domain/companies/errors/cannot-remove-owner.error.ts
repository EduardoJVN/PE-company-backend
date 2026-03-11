import { DomainError } from '@shared/errors/domain.error.js';

export class CannotRemoveOwnerError extends DomainError {
  constructor() {
    super('The owner cannot be removed from the company');
  }
}

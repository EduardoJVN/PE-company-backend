import { DomainError } from '@shared/errors/domain.error.js';

export class CannotSuspendOwnerError extends DomainError {
  constructor() {
    super('The company owner cannot be suspended');
  }
}

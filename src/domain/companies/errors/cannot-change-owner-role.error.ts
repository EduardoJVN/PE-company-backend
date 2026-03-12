import { DomainError } from '@shared/errors/domain.error.js';

export class CannotChangeOwnerRoleError extends DomainError {
  constructor() {
    super("The owner's role cannot be changed");
  }
}

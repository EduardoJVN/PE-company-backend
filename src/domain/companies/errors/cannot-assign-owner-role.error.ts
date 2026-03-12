import { DomainError } from '@shared/errors/domain.error.js';

export class CannotAssignOwnerRoleError extends DomainError {
  constructor() {
    super('The OWNER role cannot be assigned via role change');
  }
}

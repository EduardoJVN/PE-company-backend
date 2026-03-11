import { DomainError } from '@shared/errors/domain.error.js';

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

import { DomainError } from '@shared/errors/domain.error.js';

export class InvalidCompanyNameError extends DomainError {
  constructor() {
    super('Company name must not be empty');
  }
}

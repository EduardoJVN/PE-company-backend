import { NotFoundError } from '@shared/errors/not-found.error.js';

export class CompanyNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Company not found: ${id}`);
  }
}

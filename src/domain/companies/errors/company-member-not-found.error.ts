import { NotFoundError } from '@shared/errors/not-found.error.js';

export class CompanyMemberNotFoundError extends NotFoundError {
  constructor(userId: string) {
    super(`Company member not found for user: ${userId}`);
  }
}

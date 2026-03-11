import { DomainError } from '@shared/errors/domain.error.js';

export class MemberNotDeletedError extends DomainError {
  constructor(userId: string) {
    super(`Member for user ${userId} is not in DELETED status and cannot be reactivated`);
  }
}

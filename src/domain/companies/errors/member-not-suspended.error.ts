import { DomainError } from '@shared/errors/domain.error.js';

export class MemberNotSuspendedError extends DomainError {
  constructor(userId: string) {
    super(`Member for user ${userId} is not in SUSPENDED status and cannot be unsuspended`);
  }
}

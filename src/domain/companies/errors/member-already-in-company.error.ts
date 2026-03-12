import { DomainError } from '@shared/errors/domain.error.js';

export class MemberAlreadyInCompanyError extends DomainError {
  constructor(email: string) {
    super(`User with email ${email} is already an active member of this company`);
  }
}

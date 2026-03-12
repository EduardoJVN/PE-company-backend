import { ForbiddenError } from '@shared/errors/forbidden.error.js';

export class UnauthorizedCompanyAccessError extends ForbiddenError {
  constructor(companyId: string) {
    super(`Access denied to company: ${companyId}`);
  }
}

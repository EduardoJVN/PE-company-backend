import type { RequestHandler, Request, Response, NextFunction } from 'express';
import type { ICompanyRepository } from '@domain/companies/ports/company-repository.port.js';
import type { ICompanyMembershipCache } from '@domain/companies/ports/company-membership-cache.port.js';
import type { CompanyMemberRoleId } from '@domain/catalog-ids.js';

const MEMBERSHIP_TTL_MS = 5 * 60 * 1000; // 5 min

export function createCompanyContextMiddleware(
  companyRepo: ICompanyRepository,
  membershipCache: ICompanyMembershipCache,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const companyId = req.headers['x-company-id'];

    if (!companyId || typeof companyId !== 'string') {
      res.status(400).json({ error: 'Missing X-Company-Id header' });
      return;
    }

    const userId = res.locals['userId'] as string;

    const cached = await membershipCache.get(companyId, userId);

    if (cached) {
      res.locals['company'] = { id: companyId, roleId: cached.roleId };
      next();
      return;
    }

    const member = await companyRepo.findMemberByUserAndCompany(companyId, userId);

    if (!member) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await membershipCache.set(companyId, userId, member.roleId, MEMBERSHIP_TTL_MS);

    res.locals['company'] = { id: companyId, roleId: member.roleId };

    next();
  };
}

export function requireCompanyAccess(allowedRoles: CompanyMemberRoleId[]): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const company = res.locals['company'] as { id: string; roleId: CompanyMemberRoleId };

    if (!allowedRoles.includes(company.roleId)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}

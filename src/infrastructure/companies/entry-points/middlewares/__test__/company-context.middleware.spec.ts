import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  createCompanyContextMiddleware,
  requireCompanyAccess,
} from '@infra/companies/entry-points/middlewares/company-context.middleware.js';
import type { ICompanyRepository } from '@domain/companies/ports/company-repository.port.js';
import type { ICompanyMembershipCache } from '@domain/companies/ports/company-membership-cache.port.js';
import { CompanyMemberRoleId } from '@domain/catalog-ids.js';

function makeReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

function makeRes(locals: Record<string, unknown> = {}): Response {
  return {
    locals,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

const mockMember = {
  id: 'member-id',
  companyId: 'company-uuid',
  userId: 'user-uuid',
  roleId: CompanyMemberRoleId.OWNER,
  statusId: 2,
  invitedAt: null,
  invitedBy: null,
  acceptedAt: null,
  acceptedBy: null,
};

describe('createCompanyContextMiddleware', () => {
  let companyRepo: ICompanyRepository;
  let membershipCache: ICompanyMembershipCache;
  let next: NextFunction;

  beforeEach(() => {
    companyRepo = {
      findMemberByUserAndCompany: vi.fn(),
    } as unknown as ICompanyRepository;
    membershipCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    next = vi.fn();
  });

  it('returns 400 when X-Company-Id header is missing', async () => {
    const middleware = createCompanyContextMiddleware(companyRepo, membershipCache);
    const req = makeReq({});
    const res = makeRes({ userId: 'user-uuid' });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing X-Company-Id header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not an active member of the company', async () => {
    vi.mocked(companyRepo.findMemberByUserAndCompany).mockResolvedValue(null);
    const middleware = createCompanyContextMiddleware(companyRepo, membershipCache);
    const req = makeReq({ 'x-company-id': 'company-uuid' });
    const res = makeRes({ userId: 'user-uuid' });

    await middleware(req, res, next);

    expect(companyRepo.findMemberByUserAndCompany).toHaveBeenCalledWith(
      'company-uuid',
      'user-uuid',
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('injects company context and calls next on cache miss + DB hit', async () => {
    vi.mocked(companyRepo.findMemberByUserAndCompany).mockResolvedValue(mockMember);
    const middleware = createCompanyContextMiddleware(companyRepo, membershipCache);
    const req = makeReq({ 'x-company-id': 'company-uuid' });
    const res = makeRes({ userId: 'user-uuid' });

    await middleware(req, res, next);

    expect(res.locals['company']).toEqual({
      id: 'company-uuid',
      roleId: CompanyMemberRoleId.OWNER,
    });
    expect(membershipCache.set).toHaveBeenCalledWith(
      'company-uuid',
      'user-uuid',
      CompanyMemberRoleId.OWNER,
      300000,
    );
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('uses cache and skips DB when membership is cached', async () => {
    vi.mocked(membershipCache.get).mockResolvedValue({ roleId: CompanyMemberRoleId.ADMIN });
    const middleware = createCompanyContextMiddleware(companyRepo, membershipCache);
    const req = makeReq({ 'x-company-id': 'company-uuid' });
    const res = makeRes({ userId: 'user-uuid' });

    await middleware(req, res, next);

    expect(companyRepo.findMemberByUserAndCompany).not.toHaveBeenCalled();
    expect(res.locals['company']).toEqual({
      id: 'company-uuid',
      roleId: CompanyMemberRoleId.ADMIN,
    });
    expect(next).toHaveBeenCalled();
  });

  it('stores the member roleId in the company context', async () => {
    const editorMember = { ...mockMember, roleId: CompanyMemberRoleId.EDITOR };
    vi.mocked(companyRepo.findMemberByUserAndCompany).mockResolvedValue(editorMember);
    const middleware = createCompanyContextMiddleware(companyRepo, membershipCache);
    const req = makeReq({ 'x-company-id': 'company-uuid' });
    const res = makeRes({ userId: 'user-uuid' });

    await middleware(req, res, next);

    expect(res.locals['company']).toEqual({
      id: 'company-uuid',
      roleId: CompanyMemberRoleId.EDITOR,
    });
  });
});

describe('requireCompanyAccess', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it('calls next when the user role is in the allowed list', () => {
    const req = {} as Request;
    const res = makeRes({
      company: { id: 'company-uuid', roleId: CompanyMemberRoleId.ADMIN },
    });

    requireCompanyAccess([CompanyMemberRoleId.OWNER, CompanyMemberRoleId.ADMIN])(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when the user role is not in the allowed list', () => {
    const req = {} as Request;
    const res = makeRes({
      company: { id: 'company-uuid', roleId: CompanyMemberRoleId.VIEWER },
    });

    requireCompanyAccess([CompanyMemberRoleId.OWNER, CompanyMemberRoleId.ADMIN])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a single role in the allowed list', () => {
    const req = {} as Request;
    const res = makeRes({
      company: { id: 'company-uuid', roleId: CompanyMemberRoleId.OWNER },
    });

    requireCompanyAccess([CompanyMemberRoleId.OWNER])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('denies all roles when allowed list is empty', () => {
    const req = {} as Request;
    const res = makeRes({
      company: { id: 'company-uuid', roleId: CompanyMemberRoleId.OWNER },
    });

    requireCompanyAccess([])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

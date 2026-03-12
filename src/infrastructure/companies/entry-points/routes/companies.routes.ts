import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import type { CompanyController } from '@infra/companies/entry-points/company.controller.js';
import type {
  AuthenticatedRequest,
  CompanyContextRequest,
  HttpResponse,
  ResponseCookie,
} from '@infra/entry-points/base.controller.js';
import { CompanyMemberRoleId } from '@domain/catalog-ids.js';
import { requireCompanyAccess } from '@infra/companies/entry-points/middlewares/company-context.middleware.js';

const { OWNER, ADMIN, EDITOR, VIEWER } = CompanyMemberRoleId;

function toAuthenticatedRequest(req: Request, res: Response): AuthenticatedRequest {
  return {
    body: req.body as unknown,
    params: req.params as Record<string, string>,
    query: req.query as Record<string, string>,
    cookies: req.cookies as Record<string, string>,
    headers: req.headers as Record<string, string>,
    userId: res.locals['userId'] as string,
  };
}

function toCompanyContextRequest(req: Request, res: Response): CompanyContextRequest {
  const company = res.locals['company'] as { id: string; roleId: CompanyMemberRoleId };
  return {
    body: req.body as unknown,
    params: req.params as Record<string, string>,
    query: req.query as Record<string, string>,
    cookies: req.cookies as Record<string, string>,
    headers: req.headers as Record<string, string>,
    userId: res.locals['userId'] as string,
    companyId: company.id,
    companyRoleId: company.roleId,
  };
}

function sendHttpResponse(res: Response, result: HttpResponse): void {
  if (result.cookies) {
    for (const cookie of result.cookies) {
      res.cookie(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge ? cookie.maxAge * 1000 : undefined,
        sameSite: cookie.sameSite as ResponseCookie['sameSite'],
        secure: cookie.secure,
        path: '/',
      });
    }
  }

  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      res.setHeader(key, value);
    }
  }

  if (result.body === null) {
    res.status(result.status).end();
    return;
  }

  res.status(result.status).json(result.body);
}

export function createCompanyRoutes(
  controller: CompanyController,
  jwtMiddleware: RequestHandler,
  companyContextMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.use(jwtMiddleware);

  // User-level routes — no company context required
  router.post('/', async (req, res) => {
    const result = await controller.create(toAuthenticatedRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.get('/mine', async (req, res) => {
    const result = await controller.listMine(toAuthenticatedRequest(req, res));
    sendHttpResponse(res, result);
  });

  // Company-scoped routes — require X-Company-Id header + active membership
  router.get(
    '/:id',
    companyContextMiddleware,
    requireCompanyAccess([OWNER, ADMIN, EDITOR, VIEWER]),
    async (req, res) => {
      const result = await controller.getById(toCompanyContextRequest(req, res));
      sendHttpResponse(res, result);
    },
  );

  router.put(
    '/:id',
    companyContextMiddleware,
    requireCompanyAccess([OWNER, ADMIN]),
    async (req, res) => {
      const result = await controller.update(toCompanyContextRequest(req, res));
      sendHttpResponse(res, result);
    },
  );

  router.post(
    '/:id/members/invite',
    companyContextMiddleware,
    requireCompanyAccess([OWNER, ADMIN]),
    async (req, res) => {
      const result = await controller.inviteMember(toCompanyContextRequest(req, res));
      sendHttpResponse(res, result);
    },
  );

  router.put(
    '/:id/members/:userId/role',
    companyContextMiddleware,
    requireCompanyAccess([OWNER, ADMIN]),
    async (req, res) => {
      const result = await controller.changeMemberRole(toCompanyContextRequest(req, res));
      sendHttpResponse(res, result);
    },
  );

  router.put(
    '/:id/members/:userId/reactivate',
    companyContextMiddleware,
    requireCompanyAccess([OWNER, ADMIN]),
    async (req, res) => {
      const result = await controller.activateMember(toCompanyContextRequest(req, res));
      sendHttpResponse(res, result);
    },
  );

  router.delete(
    '/:id/members/:userId',
    companyContextMiddleware,
    requireCompanyAccess([OWNER, ADMIN]),
    async (req, res) => {
      const result = await controller.removeMember(toCompanyContextRequest(req, res));
      sendHttpResponse(res, result);
    },
  );

  return router;
}

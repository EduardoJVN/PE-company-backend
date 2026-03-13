import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import type { ProductController } from '@infra/products/entry-points/product.controller.js';
import type { CompanyContextRequest, HttpResponse } from '@infra/entry-points/base.controller.js';
import type { CompanyMemberRoleId } from '@domain/catalog-ids.js';
import { CompanyMemberRoleId as Roles } from '@domain/catalog-ids.js';
import { requireCompanyAccess } from '@infra/companies/entry-points/middlewares/company-context.middleware.js';

const { OWNER, ADMIN, EDITOR, VIEWER } = Roles;

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
  if (result.body === null) {
    res.status(result.status).end();
    return;
  }
  res.status(result.status).json(result.body);
}

export function createProductRoutes(
  controller: ProductController,
  jwtMiddleware: RequestHandler,
  companyContextMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.use(jwtMiddleware);
  router.use(companyContextMiddleware);

  router.get('/:id', requireCompanyAccess([OWNER, ADMIN, EDITOR, VIEWER]), async (req, res) => {
    const result = await controller.getById(toCompanyContextRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.get('/', requireCompanyAccess([OWNER, ADMIN, EDITOR, VIEWER]), async (req, res) => {
    const result = await controller.list(toCompanyContextRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.put('/:id', requireCompanyAccess([OWNER, ADMIN, EDITOR]), async (req, res) => {
    const result = await controller.update(toCompanyContextRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.post('/', requireCompanyAccess([OWNER, ADMIN, EDITOR]), async (req, res) => {
    const result = await controller.create(toCompanyContextRequest(req, res));
    sendHttpResponse(res, result);
  });

  return router;
}

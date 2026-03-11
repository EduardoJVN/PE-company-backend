import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import type { CompanyController } from '@infra/companies/entry-points/company.controller.js';
import type {
  AuthenticatedRequest,
  HttpResponse,
  ResponseCookie,
} from '@infra/entry-points/base.controller.js';

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
): Router {
  const router = Router();

  router.use(jwtMiddleware);

  router.post('/', async (req, res) => {
    const result = await controller.create(toAuthenticatedRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.get('/mine', async (req, res) => {
    const result = await controller.listMine(toAuthenticatedRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.get('/:id', async (req, res) => {
    const result = await controller.getById(toAuthenticatedRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.put('/:id', async (req, res) => {
    const result = await controller.update(toAuthenticatedRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.put('/:id/members/:userId/role', async (req, res) => {
    const result = await controller.changeMemberRole(toAuthenticatedRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.put('/:id/members/:userId/reactivate', async (req, res) => {
    const result = await controller.activateMember(toAuthenticatedRequest(req, res));
    sendHttpResponse(res, result);
  });

  router.delete('/:id/members/:userId', async (req, res) => {
    const result = await controller.removeMember(toAuthenticatedRequest(req, res));
    sendHttpResponse(res, result);
  });

  return router;
}

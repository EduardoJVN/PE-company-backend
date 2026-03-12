import { describe, it, expect, vi } from 'vitest';
import { createCompanyRoutes } from '@infra/companies/entry-points/routes/companies.routes.js';
import type { CompanyController } from '@infra/companies/entry-points/company.controller.js';
import type { RequestHandler } from 'express';

const mockController = {
  create: vi.fn().mockResolvedValue({ status: 201, body: { id: 'uuid' } }),
} as unknown as CompanyController;

const mockJwt: RequestHandler = (_req, _res, next) => next();
const mockCompanyContext: RequestHandler = (_req, _res, next) => next();

describe('createCompanyRoutes', () => {
  it('returns an Express Router', () => {
    const router = createCompanyRoutes(mockController, mockJwt, mockCompanyContext);
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });

  it('registers POST / route', () => {
    const router = createCompanyRoutes(mockController, mockJwt, mockCompanyContext);
    const stack = (
      router as unknown as {
        stack: { route?: { path: string; methods: Record<string, boolean> } }[];
      }
    ).stack;
    const postRoute = stack.find((layer) => layer.route?.methods['post']);
    expect(postRoute?.route?.path).toBe('/');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyController } from '@infra/companies/entry-points/company.controller.js';
import type { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import type { ListMyCompaniesUseCase } from '@application/companies/list-my-companies.use-case.js';
import type { GetCompanyUseCase } from '@application/companies/get-company.use-case.js';
import type { UpdateCompanyUseCase } from '@application/companies/update-company.use-case.js';
import type {
  CompanyResult,
  CompanyDetailResult,
} from '@domain/companies/ports/company-repository.port.js';
import type { AuthenticatedRequest } from '@infra/entry-points/base.controller.js';
import { CompanyStatusId } from '@domain/catalog-ids.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';

const mockResult: CompanyResult = {
  id: 'company-uuid',
  ownerId: 'owner-uuid',
  name: 'Acme Corp',
  description: null,
  logoUrl: null,
  statusId: CompanyStatusId.ACTIVE,
  isActive: true,
  isVerified: false,
  createdAt: new Date('2026-01-01'),
};

const mockDetailResult: CompanyDetailResult = {
  ...mockResult,
  updatedAt: new Date('2026-01-01'),
  verifiedAt: null,
  verifiedBy: null,
  deletedAt: null,
  sectors: [{ id: 1, name: 'Technology' }],
};

const mockCreateUseCase = {
  execute: vi.fn().mockResolvedValue(mockResult),
} as unknown as CreateCompanyUseCase;

const mockListUseCase = {
  execute: vi.fn().mockResolvedValue([mockResult]),
} as unknown as ListMyCompaniesUseCase;

const mockGetUseCase = {
  execute: vi.fn().mockResolvedValue(mockDetailResult),
} as unknown as GetCompanyUseCase;

const mockUpdateUseCase = {
  execute: vi.fn().mockResolvedValue(mockResult),
} as unknown as UpdateCompanyUseCase;

const validBody = { name: 'Acme Corp', sectorIds: [1] };
const baseReq = (body: unknown): AuthenticatedRequest => ({ body, userId: 'owner-uuid' });

function makeController() {
  return new CompanyController(
    mockCreateUseCase,
    mockListUseCase,
    mockGetUseCase,
    mockUpdateUseCase,
  );
}

describe('CompanyController.create', () => {
  let controller: CompanyController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = makeController();
  });

  it('returns 201 with company on valid input', async () => {
    const response = await controller.create(baseReq(validBody));

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockResult);
  });

  it('calls use case with ownerId from userId', async () => {
    await controller.create(baseReq(validBody));

    expect(vi.mocked(mockCreateUseCase.execute)).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'owner-uuid', name: 'Acme Corp', sectorIds: [1] }),
    );
  });

  it('passes all fields to use case', async () => {
    await controller.create(
      baseReq({
        name: 'Acme Corp',
        description: 'Una empresa',
        logoUrl: 'https://example.com/logo.png',
        sectorIds: [1, 2],
      }),
    );

    expect(vi.mocked(mockCreateUseCase.execute)).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Una empresa',
        logoUrl: 'https://example.com/logo.png',
        sectorIds: [1, 2],
      }),
    );
  });

  it('returns 400 when name is missing', async () => {
    const response = await controller.create(baseReq({ sectorIds: [1] }));

    expect(response.status).toBe(400);
    expect((response.body as { error: string }).error).toBeTruthy();
  });

  it('returns 400 when sectorIds is missing', async () => {
    const response = await controller.create(baseReq({ name: 'Acme Corp' }));

    expect(response.status).toBe(400);
  });

  it('returns 400 when sectorIds is empty', async () => {
    const response = await controller.create(baseReq({ name: 'Acme Corp', sectorIds: [] }));

    expect(response.status).toBe(400);
  });

  it('returns 400 when name is empty string', async () => {
    const response = await controller.create(baseReq({ name: '', sectorIds: [1] }));

    expect(response.status).toBe(400);
  });

  it('returns 400 when logoUrl is not a valid URL', async () => {
    const response = await controller.create(
      baseReq({ name: 'Acme Corp', logoUrl: 'not-a-url', sectorIds: [1] }),
    );

    expect(response.status).toBe(400);
  });

  it('returns 500 when use case throws unexpected error', async () => {
    vi.mocked(mockCreateUseCase.execute).mockRejectedValueOnce(new Error('DB failure'));

    const response = await controller.create(baseReq(validBody));

    expect(response.status).toBe(500);
  });
});

describe('CompanyController.listMine', () => {
  let controller: CompanyController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = makeController();
  });

  it('returns 200 with list of companies', async () => {
    const response = await controller.listMine({ userId: 'user-uuid' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([mockResult]);
  });

  it('calls use case with userId from request', async () => {
    await controller.listMine({ userId: 'user-uuid' });

    expect(vi.mocked(mockListUseCase.execute)).toHaveBeenCalledWith({ userId: 'user-uuid' });
  });

  it('returns 200 with empty array when user has no companies', async () => {
    vi.mocked(mockListUseCase.execute).mockResolvedValueOnce([]);

    const response = await controller.listMine({ userId: 'user-uuid' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns 500 when use case throws unexpected error', async () => {
    vi.mocked(mockListUseCase.execute).mockRejectedValueOnce(new Error('DB failure'));

    const response = await controller.listMine({ userId: 'user-uuid' });

    expect(response.status).toBe(500);
  });
});

describe('CompanyController.getById', () => {
  let controller: CompanyController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = makeController();
  });

  it('returns 200 with company detail', async () => {
    const response = await controller.getById({
      userId: 'owner-uuid',
      params: { id: 'company-uuid' },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockDetailResult);
  });

  it('calls use case with companyId and userId', async () => {
    await controller.getById({ userId: 'owner-uuid', params: { id: 'company-uuid' } });

    expect(vi.mocked(mockGetUseCase.execute)).toHaveBeenCalledWith({
      companyId: 'company-uuid',
      userId: 'owner-uuid',
    });
  });

  it('returns 404 when company not found or user is not a member', async () => {
    vi.mocked(mockGetUseCase.execute).mockRejectedValueOnce(
      new CompanyNotFoundError('company-uuid'),
    );

    const response = await controller.getById({
      userId: 'owner-uuid',
      params: { id: 'company-uuid' },
    });

    expect(response.status).toBe(404);
  });

  it('returns 400 when id param is missing', async () => {
    const response = await controller.getById({ userId: 'owner-uuid', params: {} });

    expect(response.status).toBe(400);
  });

  it('returns 500 when use case throws unexpected error', async () => {
    vi.mocked(mockGetUseCase.execute).mockRejectedValueOnce(new Error('DB failure'));

    const response = await controller.getById({
      userId: 'owner-uuid',
      params: { id: 'company-uuid' },
    });

    expect(response.status).toBe(500);
  });
});

describe('CompanyController.update', () => {
  let controller: CompanyController;

  const validUpdateBody = { name: 'Updated Name' };
  const updateReq = (body: unknown, id = 'company-uuid'): AuthenticatedRequest => ({
    body,
    userId: 'owner-uuid',
    params: { id },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    controller = makeController();
  });

  it('returns 200 with updated company', async () => {
    const response = await controller.update(updateReq(validUpdateBody));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResult);
  });

  it('calls use case with companyId, userId and body fields', async () => {
    await controller.update(updateReq({ name: 'Updated Name', description: 'Desc' }));

    expect(vi.mocked(mockUpdateUseCase.execute)).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-uuid',
        userId: 'owner-uuid',
        name: 'Updated Name',
        description: 'Desc',
      }),
    );
  });

  it('returns 400 when name is missing', async () => {
    const response = await controller.update(updateReq({}));

    expect(response.status).toBe(400);
  });

  it('returns 400 when name is empty string', async () => {
    const response = await controller.update(updateReq({ name: '' }));

    expect(response.status).toBe(400);
  });

  it('returns 400 when logoUrl is not a valid URL', async () => {
    const response = await controller.update(updateReq({ name: 'Updated', logoUrl: 'not-a-url' }));

    expect(response.status).toBe(400);
  });

  it('returns 400 when id param is missing', async () => {
    const response = await controller.update({
      userId: 'owner-uuid',
      body: validUpdateBody,
      params: {},
    });

    expect(response.status).toBe(400);
  });

  it('returns 403 when user does not have permission', async () => {
    vi.mocked(mockUpdateUseCase.execute).mockRejectedValueOnce(
      new UnauthorizedCompanyAccessError('company-uuid'),
    );

    const response = await controller.update(updateReq(validUpdateBody));

    expect(response.status).toBe(403);
  });

  it('returns 404 when company not found', async () => {
    vi.mocked(mockUpdateUseCase.execute).mockRejectedValueOnce(
      new CompanyNotFoundError('company-uuid'),
    );

    const response = await controller.update(updateReq(validUpdateBody));

    expect(response.status).toBe(404);
  });

  it('returns 500 when use case throws unexpected error', async () => {
    vi.mocked(mockUpdateUseCase.execute).mockRejectedValueOnce(new Error('DB failure'));

    const response = await controller.update(updateReq(validUpdateBody));

    expect(response.status).toBe(500);
  });
});

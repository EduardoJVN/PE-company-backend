import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyController } from '@infra/companies/entry-points/company.controller.js';
import type { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import type { CompanyResult } from '@domain/companies/ports/company-repository.port.js';
import type { AuthenticatedRequest } from '@infra/entry-points/base.controller.js';
import { CompanyStatusId } from '@domain/catalog-ids.js';

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

const mockUseCase = {
  execute: vi.fn().mockResolvedValue(mockResult),
} as unknown as CreateCompanyUseCase;

const validBody = { name: 'Acme Corp', sectorIds: [1] };
const baseReq = (body: unknown): AuthenticatedRequest => ({ body, userId: 'owner-uuid' });

describe('CompanyController.create', () => {
  let controller: CompanyController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new CompanyController(mockUseCase);
  });

  it('returns 201 with company on valid input', async () => {
    const response = await controller.create(baseReq(validBody));

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockResult);
  });

  it('calls use case with ownerId from userId', async () => {
    await controller.create(baseReq(validBody));

    expect(vi.mocked(mockUseCase.execute)).toHaveBeenCalledWith(
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

    expect(vi.mocked(mockUseCase.execute)).toHaveBeenCalledWith(
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
    vi.mocked(mockUseCase.execute).mockRejectedValueOnce(new Error('DB failure'));

    const response = await controller.create(baseReq(validBody));

    expect(response.status).toBe(500);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyController } from '@infra/companies/entry-points/company.controller.js';
import type { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import type { ListMyCompaniesUseCase } from '@application/companies/list-my-companies.use-case.js';
import type { GetCompanyUseCase } from '@application/companies/get-company.use-case.js';
import type { UpdateCompanyUseCase } from '@application/companies/update-company.use-case.js';
import type { ChangeMemberRoleUseCase } from '@application/companies/change-member-role.use-case.js';
import type { RemoveCompanyMemberUseCase } from '@application/companies/remove-company-member.use-case.js';
import type { ActivateCompanyMemberUseCase } from '@application/companies/activate-company-member.use-case.js';
import type { InviteCompanyMemberUseCase } from '@application/companies/invite-company-member.use-case.js';
import type {
  CompanyResult,
  CompanyDetailResult,
  CompanyMemberResult,
} from '@domain/companies/ports/company-repository.port.js';
import type { AuthenticatedRequest } from '@infra/entry-points/base.controller.js';
import {
  CompanyStatusId,
  CompanyMemberRoleId,
  CompanyMemberStatusId,
} from '@domain/catalog-ids.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { CompanyMemberNotFoundError } from '@domain/companies/errors/company-member-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import { CannotChangeOwnerRoleError } from '@domain/companies/errors/cannot-change-owner-role.error.js';
import { CannotRemoveOwnerError } from '@domain/companies/errors/cannot-remove-owner.error.js';
import { MemberNotDeletedError } from '@domain/companies/errors/member-not-deleted.error.js';

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

const mockMemberResult: CompanyMemberResult = {
  id: 'member-uuid',
  companyId: 'company-uuid',
  userId: 'editor-uuid',
  roleId: CompanyMemberRoleId.ADMIN,
  statusId: CompanyMemberStatusId.ACTIVE,
  invitedAt: null,
  invitedBy: null,
  acceptedAt: null,
  acceptedBy: null,
};

const mockChangeMemberRoleUseCase = {
  execute: vi.fn().mockResolvedValue(mockMemberResult),
} as unknown as ChangeMemberRoleUseCase;

const mockRemoveCompanyMemberUseCase = {
  execute: vi.fn().mockResolvedValue(undefined),
} as unknown as RemoveCompanyMemberUseCase;

const mockActivateCompanyMemberUseCase = {
  execute: vi.fn().mockResolvedValue(undefined),
} as unknown as ActivateCompanyMemberUseCase;

const mockInviteCompanyMemberUseCase = {
  execute: vi.fn(),
} as unknown as InviteCompanyMemberUseCase;

const validBody = { name: 'Acme Corp', sectorIds: [1] };
const baseReq = (body: unknown): AuthenticatedRequest => ({ body, userId: 'owner-uuid' });

function makeController() {
  return new CompanyController(
    mockCreateUseCase,
    mockListUseCase,
    mockGetUseCase,
    mockUpdateUseCase,
    mockChangeMemberRoleUseCase,
    mockRemoveCompanyMemberUseCase,
    mockActivateCompanyMemberUseCase,
    mockInviteCompanyMemberUseCase,
    'https://app.example.com',
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

describe('CompanyController.changeMemberRole', () => {
  let controller: CompanyController;

  const validRoleBody = { roleId: CompanyMemberRoleId.ADMIN };
  const changeRoleReq = (
    body: unknown,
    companyId = 'company-uuid',
    userId = 'editor-uuid',
  ): AuthenticatedRequest => ({
    body,
    userId: 'owner-uuid',
    params: { id: companyId, userId },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    controller = makeController();
  });

  it('returns 200 with updated member on valid input', async () => {
    const response = await controller.changeMemberRole(changeRoleReq(validRoleBody));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockMemberResult);
  });

  it('calls use case with companyId, requesterId, targetUserId and newRoleId', async () => {
    await controller.changeMemberRole(changeRoleReq(validRoleBody));

    expect(vi.mocked(mockChangeMemberRoleUseCase.execute)).toHaveBeenCalledWith({
      companyId: 'company-uuid',
      requesterId: 'owner-uuid',
      targetUserId: 'editor-uuid',
      newRoleId: CompanyMemberRoleId.ADMIN,
    });
  });

  it('returns 400 when roleId is missing', async () => {
    const response = await controller.changeMemberRole(changeRoleReq({}));

    expect(response.status).toBe(400);
  });

  it('returns 400 when roleId is OWNER', async () => {
    const response = await controller.changeMemberRole(
      changeRoleReq({ roleId: CompanyMemberRoleId.OWNER }),
    );

    expect(response.status).toBe(400);
  });

  it('returns 400 when company id param is missing', async () => {
    const response = await controller.changeMemberRole({
      userId: 'owner-uuid',
      body: validRoleBody,
      params: { userId: 'editor-uuid' },
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 when userId param is missing', async () => {
    const response = await controller.changeMemberRole({
      userId: 'owner-uuid',
      body: validRoleBody,
      params: { id: 'company-uuid' },
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 when target is the owner (CannotChangeOwnerRoleError)', async () => {
    vi.mocked(mockChangeMemberRoleUseCase.execute).mockRejectedValueOnce(
      new CannotChangeOwnerRoleError(),
    );

    const response = await controller.changeMemberRole(changeRoleReq(validRoleBody));

    expect(response.status).toBe(400);
  });

  it('returns 403 when requester lacks permission', async () => {
    vi.mocked(mockChangeMemberRoleUseCase.execute).mockRejectedValueOnce(
      new UnauthorizedCompanyAccessError('company-uuid'),
    );

    const response = await controller.changeMemberRole(changeRoleReq(validRoleBody));

    expect(response.status).toBe(403);
  });

  it('returns 404 when requester is not a company member', async () => {
    vi.mocked(mockChangeMemberRoleUseCase.execute).mockRejectedValueOnce(
      new CompanyNotFoundError('company-uuid'),
    );

    const response = await controller.changeMemberRole(changeRoleReq(validRoleBody));

    expect(response.status).toBe(404);
  });

  it('returns 404 when target user is not a member', async () => {
    vi.mocked(mockChangeMemberRoleUseCase.execute).mockRejectedValueOnce(
      new CompanyMemberNotFoundError('editor-uuid'),
    );

    const response = await controller.changeMemberRole(changeRoleReq(validRoleBody));

    expect(response.status).toBe(404);
  });

  it('returns 500 when use case throws unexpected error', async () => {
    vi.mocked(mockChangeMemberRoleUseCase.execute).mockRejectedValueOnce(new Error('DB failure'));

    const response = await controller.changeMemberRole(changeRoleReq(validRoleBody));

    expect(response.status).toBe(500);
  });
});

describe('CompanyController.removeMember', () => {
  let controller: CompanyController;

  const removeReq = (companyId = 'company-uuid', userId = 'editor-uuid'): AuthenticatedRequest => ({
    userId: 'owner-uuid',
    params: { id: companyId, userId },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    controller = makeController();
  });

  it('returns 204 with no body on successful removal', async () => {
    const response = await controller.removeMember(removeReq());

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it('calls use case with companyId, requesterId and targetUserId', async () => {
    await controller.removeMember(removeReq());

    expect(vi.mocked(mockRemoveCompanyMemberUseCase.execute)).toHaveBeenCalledWith({
      companyId: 'company-uuid',
      requesterId: 'owner-uuid',
      targetUserId: 'editor-uuid',
    });
  });

  it('returns 400 when company id param is missing', async () => {
    const response = await controller.removeMember({
      userId: 'owner-uuid',
      params: { userId: 'editor-uuid' },
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 when userId param is missing', async () => {
    const response = await controller.removeMember({
      userId: 'owner-uuid',
      params: { id: 'company-uuid' },
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 when target is the owner (CannotRemoveOwnerError)', async () => {
    vi.mocked(mockRemoveCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new CannotRemoveOwnerError(),
    );

    const response = await controller.removeMember(removeReq());

    expect(response.status).toBe(400);
  });

  it('returns 403 when requester lacks permission', async () => {
    vi.mocked(mockRemoveCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new UnauthorizedCompanyAccessError('company-uuid'),
    );

    const response = await controller.removeMember(removeReq());

    expect(response.status).toBe(403);
  });

  it('returns 404 when requester is not a company member', async () => {
    vi.mocked(mockRemoveCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new CompanyNotFoundError('company-uuid'),
    );

    const response = await controller.removeMember(removeReq());

    expect(response.status).toBe(404);
  });

  it('returns 404 when target user is not a member', async () => {
    vi.mocked(mockRemoveCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new CompanyMemberNotFoundError('editor-uuid'),
    );

    const response = await controller.removeMember(removeReq());

    expect(response.status).toBe(404);
  });

  it('returns 500 when use case throws unexpected error', async () => {
    vi.mocked(mockRemoveCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new Error('DB failure'),
    );

    const response = await controller.removeMember(removeReq());

    expect(response.status).toBe(500);
  });
});

describe('CompanyController.activateMember', () => {
  let controller: CompanyController;

  const activateReq = (
    companyId = 'company-uuid',
    userId = 'editor-uuid',
  ): AuthenticatedRequest => ({
    userId: 'owner-uuid',
    params: { id: companyId, userId },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    controller = makeController();
  });

  it('returns 204 with no body on successful activation', async () => {
    const response = await controller.activateMember(activateReq());

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it('calls use case with companyId, requesterId and targetUserId', async () => {
    await controller.activateMember(activateReq());

    expect(vi.mocked(mockActivateCompanyMemberUseCase.execute)).toHaveBeenCalledWith({
      companyId: 'company-uuid',
      requesterId: 'owner-uuid',
      targetUserId: 'editor-uuid',
    });
  });

  it('returns 400 when company id param is missing', async () => {
    const response = await controller.activateMember({
      userId: 'owner-uuid',
      params: { userId: 'editor-uuid' },
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 when userId param is missing', async () => {
    const response = await controller.activateMember({
      userId: 'owner-uuid',
      params: { id: 'company-uuid' },
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 when target is not in DELETED status (MemberNotDeletedError)', async () => {
    vi.mocked(mockActivateCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new MemberNotDeletedError('editor-uuid'),
    );

    const response = await controller.activateMember(activateReq());

    expect(response.status).toBe(400);
  });

  it('returns 403 when requester lacks permission', async () => {
    vi.mocked(mockActivateCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new UnauthorizedCompanyAccessError('company-uuid'),
    );

    const response = await controller.activateMember(activateReq());

    expect(response.status).toBe(403);
  });

  it('returns 404 when requester is not an active company member', async () => {
    vi.mocked(mockActivateCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new CompanyNotFoundError('company-uuid'),
    );

    const response = await controller.activateMember(activateReq());

    expect(response.status).toBe(404);
  });

  it('returns 404 when target user has no membership record', async () => {
    vi.mocked(mockActivateCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new CompanyMemberNotFoundError('editor-uuid'),
    );

    const response = await controller.activateMember(activateReq());

    expect(response.status).toBe(404);
  });

  it('returns 500 when use case throws unexpected error', async () => {
    vi.mocked(mockActivateCompanyMemberUseCase.execute).mockRejectedValueOnce(
      new Error('DB failure'),
    );

    const response = await controller.activateMember(activateReq());

    expect(response.status).toBe(500);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateCompanyUseCase } from '@application/companies/update-company.use-case.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import type {
  ICompanyRepository,
  CompanyResult,
  CompanyDetailResult,
  CompanyMemberResult,
} from '@domain/companies/ports/company-repository.port.js';
import {
  CompanyStatusId,
  CompanyMemberRoleId,
  CompanyMemberStatusId,
} from '@domain/catalog-ids.js';

const mockCompanyResult: CompanyResult = {
  id: 'company-uuid',
  ownerId: 'owner-uuid',
  name: 'Updated Name',
  description: null,
  logoUrl: null,
  statusId: CompanyStatusId.ACTIVE,
  isActive: true,
  isVerified: false,
  createdAt: new Date('2026-01-01'),
};

const mockDetail: CompanyDetailResult = {
  id: 'company-uuid',
  ownerId: 'owner-uuid',
  name: 'Acme Corp',
  description: null,
  logoUrl: null,
  statusId: CompanyStatusId.ACTIVE,
  isActive: true,
  isVerified: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  verifiedAt: null,
  verifiedBy: null,
  deletedAt: null,
  sectors: [{ id: 1, name: 'Technology' }],
};

const ownerMemberResult: CompanyMemberResult = {
  id: 'member-uuid',
  companyId: 'company-uuid',
  userId: 'owner-uuid',
  roleId: CompanyMemberRoleId.OWNER,
  statusId: CompanyMemberStatusId.ACTIVE,
  invitedAt: null,
  invitedBy: null,
  acceptedAt: null,
  acceptedBy: null,
};

const adminMemberResult: CompanyMemberResult = {
  ...ownerMemberResult,
  roleId: CompanyMemberRoleId.ADMIN,
};

const editorMemberResult: CompanyMemberResult = {
  ...ownerMemberResult,
  roleId: CompanyMemberRoleId.EDITOR,
};

const mockRepo: ICompanyRepository = {
  createWithOwner: vi.fn(),
  update: vi.fn().mockResolvedValue(mockCompanyResult),
  findByMemberId: vi.fn(),
  findByIdForMember: vi.fn().mockResolvedValue(mockDetail),
  findMemberByUserAndCompany: vi.fn().mockResolvedValue(ownerMemberResult),
  findMemberByUserAndCompanyAnyStatus: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  suspendMember: vi.fn(),
  unsuspendMember: vi.fn(),
  activateMember: vi.fn(),
  inviteMember: vi.fn(),
};

const baseInput = { companyId: 'company-uuid', userId: 'owner-uuid', name: 'Updated Name' };

describe('UpdateCompanyUseCase', () => {
  let useCase: UpdateCompanyUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.findByIdForMember).mockResolvedValue(mockDetail);
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(ownerMemberResult);
    vi.mocked(mockRepo.update).mockResolvedValue(mockCompanyResult);
    useCase = new UpdateCompanyUseCase(mockRepo);
  });

  it('calls findByIdForMember and findMemberByUserAndCompany in parallel', async () => {
    await useCase.execute(baseInput);

    expect(vi.mocked(mockRepo.findByIdForMember)).toHaveBeenCalledWith(
      'company-uuid',
      'owner-uuid',
    );
    expect(vi.mocked(mockRepo.findMemberByUserAndCompany)).toHaveBeenCalledWith(
      'company-uuid',
      'owner-uuid',
    );
  });

  it('calls repo.update once with the updated company', async () => {
    await useCase.execute(baseInput);

    expect(vi.mocked(mockRepo.update)).toHaveBeenCalledOnce();
    const companyArg = vi.mocked(mockRepo.update).mock.calls[0][0];
    expect(companyArg.id).toBe('company-uuid');
    expect(companyArg.name).toBe('Updated Name');
  });

  it('returns the result from repo.update', async () => {
    const result = await useCase.execute(baseInput);

    expect(result).toEqual(mockCompanyResult);
  });

  it('allows OWNER to update', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValueOnce(ownerMemberResult);

    await expect(useCase.execute(baseInput)).resolves.not.toThrow();
  });

  it('allows ADMIN to update', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValueOnce(adminMemberResult);

    await expect(useCase.execute(baseInput)).resolves.not.toThrow();
  });

  it('throws UnauthorizedCompanyAccessError for EDITOR role', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValueOnce(editorMemberResult);

    await expect(useCase.execute(baseInput)).rejects.toThrow(UnauthorizedCompanyAccessError);
  });

  it('throws UnauthorizedCompanyAccessError for VIEWER role', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValueOnce({
      ...ownerMemberResult,
      roleId: CompanyMemberRoleId.VIEWER,
    });

    await expect(useCase.execute(baseInput)).rejects.toThrow(UnauthorizedCompanyAccessError);
  });

  it('throws CompanyNotFoundError when company is not found', async () => {
    vi.mocked(mockRepo.findByIdForMember).mockResolvedValueOnce(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(CompanyNotFoundError);
  });

  it('throws CompanyNotFoundError when member is not found', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValueOnce(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(CompanyNotFoundError);
  });

  it('passes description and logoUrl to the updated company', async () => {
    await useCase.execute({
      ...baseInput,
      description: 'Nueva descripción',
      logoUrl: 'https://example.com/logo.png',
    });

    const companyArg = vi.mocked(mockRepo.update).mock.calls[0][0];
    expect(companyArg.description).toBe('Nueva descripción');
    expect(companyArg.logoUrl).toBe('https://example.com/logo.png');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import type {
  ICompanyRepository,
  CreateCompanyData,
  CreateMemberData,
  CompanyResult,
} from '@domain/companies/ports/company-repository.port.js';
import {
  CompanyStatusId,
  CompanyMemberRoleId,
  CompanyMemberStatusId,
} from '@domain/catalog-ids.js';

const mockCompanyResult: CompanyResult = {
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

const mockRepo: ICompanyRepository = {
  createWithOwner: vi.fn().mockResolvedValue(mockCompanyResult),
};

describe('CreateCompanyUseCase', () => {
  let useCase: CreateCompanyUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateCompanyUseCase(mockRepo);
  });

  it('creates company with ACTIVE status', async () => {
    await useCase.execute({ ownerId: 'owner-uuid', name: 'Acme Corp' });

    const [companyArg] = vi.mocked(mockRepo.createWithOwner).mock.calls[0] as [
      CreateCompanyData,
      CreateMemberData,
    ];

    expect(companyArg.statusId).toBe(CompanyStatusId.ACTIVE);
    expect(companyArg.ownerId).toBe('owner-uuid');
    expect(companyArg.name).toBe('Acme Corp');
  });

  it('registers owner as OWNER role with ACTIVE member status', async () => {
    await useCase.execute({ ownerId: 'owner-uuid', name: 'Acme Corp' });

    const [companyArg, memberArg] = vi.mocked(mockRepo.createWithOwner).mock.calls[0] as [
      CreateCompanyData,
      CreateMemberData,
    ];

    expect(memberArg.userId).toBe('owner-uuid');
    expect(memberArg.companyId).toBe(companyArg.id);
    expect(memberArg.roleId).toBe(CompanyMemberRoleId.OWNER);
    expect(memberArg.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('generates distinct UUIDs for company and member', async () => {
    await useCase.execute({ ownerId: 'owner-uuid', name: 'Acme Corp' });

    const [companyArg, memberArg] = vi.mocked(mockRepo.createWithOwner).mock.calls[0] as [
      CreateCompanyData,
      CreateMemberData,
    ];

    expect(companyArg.id).toBeTruthy();
    expect(memberArg.id).toBeTruthy();
    expect(companyArg.id).not.toBe(memberArg.id);
  });

  it('passes optional fields to repository', async () => {
    await useCase.execute({
      ownerId: 'owner-uuid',
      name: 'Acme Corp',
      description: 'Una empresa increíble',
      logoUrl: 'https://example.com/logo.png',
      sectorIds: [1, 2],
    });

    const [companyArg] = vi.mocked(mockRepo.createWithOwner).mock.calls[0] as [
      CreateCompanyData,
      CreateMemberData,
    ];

    expect(companyArg.description).toBe('Una empresa increíble');
    expect(companyArg.logoUrl).toBe('https://example.com/logo.png');
    expect(companyArg.sectorIds).toEqual([1, 2]);
  });

  it('returns the result from the repository', async () => {
    const result = await useCase.execute({ ownerId: 'owner-uuid', name: 'Acme Corp' });
    expect(result).toEqual(mockCompanyResult);
  });
});

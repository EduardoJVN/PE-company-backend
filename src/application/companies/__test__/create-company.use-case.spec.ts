import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCompanyUseCase } from '@application/companies/create-company.use-case.js';
import type {
  ICompanyRepository,
  CompanyResult,
} from '@domain/companies/ports/company-repository.port.js';
import type { Company } from '@domain/companies/entities/company.entity.js';
import type { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
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
  update: vi.fn(),
  findByMemberId: vi.fn(),
  findByIdForMember: vi.fn(),
  findMemberByUserAndCompany: vi.fn(),
  findMemberByUserAndCompanyAnyStatus: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  suspendMember: vi.fn(),
  unsuspendMember: vi.fn(),
  activateMember: vi.fn(),
  inviteMember: vi.fn(),
};

const baseInput = { ownerId: 'owner-uuid', name: 'Acme Corp', sectorIds: [1] };

describe('CreateCompanyUseCase', () => {
  let useCase: CreateCompanyUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateCompanyUseCase(mockRepo);
  });

  it('creates company entity with ACTIVE status', async () => {
    await useCase.execute(baseInput);

    const [companyArg] = vi.mocked(mockRepo.createWithOwner).mock.calls[0] as [
      Company,
      CompanyMember,
    ];

    expect(companyArg.statusId).toBe(CompanyStatusId.ACTIVE);
    expect(companyArg.ownerId).toBe('owner-uuid');
    expect(companyArg.name).toBe('Acme Corp');
  });

  it('registers owner as OWNER role with ACTIVE member status', async () => {
    await useCase.execute(baseInput);

    const [companyArg, memberArg] = vi.mocked(mockRepo.createWithOwner).mock.calls[0] as [
      Company,
      CompanyMember,
    ];

    expect(memberArg.userId).toBe('owner-uuid');
    expect(memberArg.companyId).toBe(companyArg.id);
    expect(memberArg.roleId).toBe(CompanyMemberRoleId.OWNER);
    expect(memberArg.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('owner member has no invitation data', async () => {
    await useCase.execute(baseInput);

    const [, memberArg] = vi.mocked(mockRepo.createWithOwner).mock.calls[0] as [
      Company,
      CompanyMember,
    ];

    expect(memberArg.invitedAt).toBeNull();
    expect(memberArg.invitedBy).toBeNull();
    expect(memberArg.acceptedAt).toBeNull();
    expect(memberArg.acceptedBy).toBeNull();
  });

  it('generates distinct UUIDs for company and member', async () => {
    await useCase.execute(baseInput);

    const [companyArg, memberArg] = vi.mocked(mockRepo.createWithOwner).mock.calls[0] as [
      Company,
      CompanyMember,
    ];

    expect(companyArg.id).toBeTruthy();
    expect(memberArg.id).toBeTruthy();
    expect(companyArg.id).not.toBe(memberArg.id);
  });

  it('passes all fields to the company entity', async () => {
    await useCase.execute({
      ownerId: 'owner-uuid',
      name: 'Acme Corp',
      description: 'Una empresa increíble',
      logoUrl: 'https://example.com/logo.png',
      sectorIds: [1, 2],
    });

    const [companyArg] = vi.mocked(mockRepo.createWithOwner).mock.calls[0] as [
      Company,
      CompanyMember,
    ];

    expect(companyArg.description).toBe('Una empresa increíble');
    expect(companyArg.logoUrl).toBe('https://example.com/logo.png');
    expect(companyArg.sectorIds).toEqual([1, 2]);
  });

  it('returns the result from the repository', async () => {
    const result = await useCase.execute(baseInput);
    expect(result).toEqual(mockCompanyResult);
  });
});

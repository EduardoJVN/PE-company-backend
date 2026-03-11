import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { PrismaCompanyRepository } from '@infra/companies/adapters/prisma-company.repository.js';
import type {
  CreateCompanyData,
  CreateMemberData,
  CompanyResult,
} from '@domain/companies/ports/company-repository.port.js';
import {
  CompanyStatusId,
  CompanyMemberRoleId,
  CompanyMemberStatusId,
} from '@domain/catalog-ids.js';

const companyData: CreateCompanyData = {
  id: 'company-uuid',
  ownerId: 'owner-uuid',
  name: 'Acme Corp',
  statusId: CompanyStatusId.ACTIVE,
  sectorIds: [1],
};

const memberData: CreateMemberData = {
  id: 'member-uuid',
  companyId: 'company-uuid',
  userId: 'owner-uuid',
  roleId: CompanyMemberRoleId.OWNER,
  statusId: CompanyMemberStatusId.ACTIVE,
};

const dbResult: CompanyResult = {
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

function makeMockDb(createResult: CompanyResult, findManyResult: CompanyResult[] = []) {
  const mockCreate = vi.fn().mockResolvedValue(createResult);
  const mockFindMany = vi.fn().mockResolvedValue(findManyResult);
  const mockDb = {
    company: { create: mockCreate, findMany: mockFindMany },
  } as unknown as PrismaClient;

  return { mockDb, mockCreate, mockFindMany };
}

describe('PrismaCompanyRepository.createWithOwner', () => {
  let repo: PrismaCompanyRepository;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls company.create once', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.createWithOwner(companyData, memberData);

    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('creates company with correct core fields', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.createWithOwner(companyData, memberData);

    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.id).toBe('company-uuid');
    expect(callData.ownerId).toBe('owner-uuid');
    expect(callData.name).toBe('Acme Corp');
    expect(callData.statusId).toBe(CompanyStatusId.ACTIVE);
  });

  it('creates member nested with OWNER role', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.createWithOwner(companyData, memberData);

    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.members.create.userId).toBe('owner-uuid');
    expect(callData.members.create.roleId).toBe(CompanyMemberRoleId.OWNER);
    expect(callData.members.create.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('creates sectors from sectorIds', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.createWithOwner({ ...companyData, sectorIds: [1, 3] }, memberData);

    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.sectors).toEqual({ create: [{ sectorId: 1 }, { sectorId: 3 }] });
  });

  it('returns the company result', async () => {
    const { mockDb } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.createWithOwner(companyData, memberData);

    expect(result).toEqual(dbResult);
  });
});

describe('PrismaCompanyRepository.findByMemberId', () => {
  let repo: PrismaCompanyRepository;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls company.findMany once', async () => {
    const { mockDb, mockFindMany } = makeMockDb(dbResult, [dbResult]);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.findByMemberId('user-uuid');

    expect(mockFindMany).toHaveBeenCalledOnce();
  });

  it('filters by userId and ACTIVE member status', async () => {
    const { mockDb, mockFindMany } = makeMockDb(dbResult, [dbResult]);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.findByMemberId('user-uuid');

    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.where.members.some.userId).toBe('user-uuid');
    expect(callArg.where.members.some.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('returns the list of companies', async () => {
    const { mockDb } = makeMockDb(dbResult, [dbResult]);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.findByMemberId('user-uuid');

    expect(result).toEqual([dbResult]);
  });

  it('returns empty array when user has no active memberships', async () => {
    const { mockDb } = makeMockDb(dbResult, []);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.findByMemberId('user-uuid');

    expect(result).toEqual([]);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { PrismaCompanyRepository } from '@infra/companies/adapters/prisma-company.repository.js';
import { Company } from '@domain/companies/entities/company.entity.js';
import { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
import type {
  CompanyResult,
  CompanyDetailResult,
  CompanyMemberResult,
} from '@domain/companies/ports/company-repository.port.js';
import {
  CompanyStatusId,
  CompanyMemberRoleId,
  CompanyMemberStatusId,
} from '@domain/catalog-ids.js';

const companyEntity = Company.create('company-uuid', 'owner-uuid', 'Acme Corp', [1]);
const memberEntity = CompanyMember.createOwner('member-uuid', 'company-uuid', 'owner-uuid');

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

function makeMockDb(
  createResult: CompanyResult,
  findManyResult: CompanyResult[] = [],
  findFirstResult: unknown = null,
  updateResult: CompanyResult | null = null,
  memberFindFirstResult: unknown = null,
) {
  const mockCreate = vi.fn().mockResolvedValue(createResult);
  const mockUpdate = vi.fn().mockResolvedValue(updateResult ?? createResult);
  const mockFindMany = vi.fn().mockResolvedValue(findManyResult);
  const mockFindFirst = vi.fn().mockResolvedValue(findFirstResult);
  const mockMemberFindFirst = vi.fn().mockResolvedValue(memberFindFirstResult);
  const mockDb = {
    company: {
      create: mockCreate,
      update: mockUpdate,
      findMany: mockFindMany,
      findFirst: mockFindFirst,
    },
    companyMember: { findFirst: mockMemberFindFirst },
  } as unknown as PrismaClient;

  return { mockDb, mockCreate, mockUpdate, mockFindMany, mockFindFirst, mockMemberFindFirst };
}

// Raw shape returned by Prisma before mapping
const dbDetailRaw = {
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
  sectors: [{ sector: { id: 1, name: 'Technology' } }],
};

const expectedDetail: CompanyDetailResult = {
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

describe('PrismaCompanyRepository.createWithOwner', () => {
  let repo: PrismaCompanyRepository;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls company.create once', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.createWithOwner(companyEntity, memberEntity);

    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('maps company entity fields to Prisma data', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.createWithOwner(companyEntity, memberEntity);

    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.id).toBe('company-uuid');
    expect(callData.ownerId).toBe('owner-uuid');
    expect(callData.name).toBe('Acme Corp');
    expect(callData.statusId).toBe(CompanyStatusId.ACTIVE);
  });

  it('maps member entity fields including invitation nulls', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.createWithOwner(companyEntity, memberEntity);

    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.members.create.userId).toBe('owner-uuid');
    expect(callData.members.create.roleId).toBe(CompanyMemberRoleId.OWNER);
    expect(callData.members.create.statusId).toBe(CompanyMemberStatusId.ACTIVE);
    expect(callData.members.create.invitedAt).toBeNull();
    expect(callData.members.create.invitedBy).toBeNull();
    expect(callData.members.create.acceptedAt).toBeNull();
    expect(callData.members.create.acceptedBy).toBeNull();
  });

  it('creates sectors from company sectorIds', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    const entityWithMultipleSectors = Company.create(
      'company-uuid',
      'owner-uuid',
      'Acme Corp',
      [1, 3],
    );
    await repo.createWithOwner(entityWithMultipleSectors, memberEntity);

    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.sectors).toEqual({ create: [{ sectorId: 1 }, { sectorId: 3 }] });
  });

  it('returns the company result', async () => {
    const { mockDb } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.createWithOwner(companyEntity, memberEntity);

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

describe('PrismaCompanyRepository.findByIdForMember', () => {
  let repo: PrismaCompanyRepository;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls company.findFirst once', async () => {
    const { mockDb, mockFindFirst } = makeMockDb(dbResult, [], dbDetailRaw);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.findByIdForMember('company-uuid', 'owner-uuid');

    expect(mockFindFirst).toHaveBeenCalledOnce();
  });

  it('filters by companyId and ACTIVE membership of userId', async () => {
    const { mockDb, mockFindFirst } = makeMockDb(dbResult, [], dbDetailRaw);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.findByIdForMember('company-uuid', 'owner-uuid');

    const callArg = mockFindFirst.mock.calls[0][0];
    expect(callArg.where.id).toBe('company-uuid');
    expect(callArg.where.members.some.userId).toBe('owner-uuid');
    expect(callArg.where.members.some.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('maps sectors to { id, name } objects', async () => {
    const { mockDb } = makeMockDb(dbResult, [], dbDetailRaw);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.findByIdForMember('company-uuid', 'owner-uuid');

    expect(result?.sectors).toEqual([{ id: 1, name: 'Technology' }]);
  });

  it('returns mapped CompanyDetailResult', async () => {
    const { mockDb } = makeMockDb(dbResult, [], dbDetailRaw);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.findByIdForMember('company-uuid', 'owner-uuid');

    expect(result).toEqual(expectedDetail);
  });

  it('returns null when company not found or user is not a member', async () => {
    const { mockDb } = makeMockDb(dbResult, [], null);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.findByIdForMember('company-uuid', 'non-member-uuid');

    expect(result).toBeNull();
  });
});

describe('PrismaCompanyRepository.update', () => {
  let repo: PrismaCompanyRepository;

  const updatedDbResult: CompanyResult = {
    ...dbResult,
    name: 'Updated Name',
    description: 'Nueva descripción',
  };

  const updatedEntity = Company.reconstitute(
    'company-uuid',
    'owner-uuid',
    'Updated Name',
    'Nueva descripción',
    null,
    CompanyStatusId.ACTIVE,
    [1],
    true,
    false,
    null,
    null,
    new Date('2026-01-01'),
    new Date('2026-02-01'),
    null,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls company.update once', async () => {
    const { mockDb, mockUpdate } = makeMockDb(dbResult, [], null, updatedDbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.update(updatedEntity);

    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it('maps name, description, logoUrl and updatedAt to the update data', async () => {
    const { mockDb, mockUpdate } = makeMockDb(dbResult, [], null, updatedDbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.update(updatedEntity);

    const callData = mockUpdate.mock.calls[0][0].data;
    expect(callData.name).toBe('Updated Name');
    expect(callData.description).toBe('Nueva descripción');
    expect(callData.logoUrl).toBeNull();
    expect(callData.updatedAt).toBeInstanceOf(Date);
  });

  it('filters by company id in the where clause', async () => {
    const { mockDb, mockUpdate } = makeMockDb(dbResult, [], null, updatedDbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.update(updatedEntity);

    expect(mockUpdate.mock.calls[0][0].where.id).toBe('company-uuid');
  });

  it('returns the company result', async () => {
    const { mockDb } = makeMockDb(dbResult, [], null, updatedDbResult);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.update(updatedEntity);

    expect(result).toEqual(updatedDbResult);
  });
});

describe('PrismaCompanyRepository.findMemberByUserAndCompany', () => {
  let repo: PrismaCompanyRepository;

  const memberRaw: CompanyMemberResult = {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls companyMember.findFirst once', async () => {
    const { mockDb, mockMemberFindFirst } = makeMockDb(dbResult, [], null, null, memberRaw);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.findMemberByUserAndCompany('company-uuid', 'owner-uuid');

    expect(mockMemberFindFirst).toHaveBeenCalledOnce();
  });

  it('filters by companyId, userId and ACTIVE status', async () => {
    const { mockDb, mockMemberFindFirst } = makeMockDb(dbResult, [], null, null, memberRaw);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.findMemberByUserAndCompany('company-uuid', 'owner-uuid');

    const where = mockMemberFindFirst.mock.calls[0][0].where;
    expect(where.companyId).toBe('company-uuid');
    expect(where.userId).toBe('owner-uuid');
    expect(where.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('returns the member result', async () => {
    const { mockDb } = makeMockDb(dbResult, [], null, null, memberRaw);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.findMemberByUserAndCompany('company-uuid', 'owner-uuid');

    expect(result).toEqual(memberRaw);
  });

  it('returns null when member is not found', async () => {
    const { mockDb } = makeMockDb(dbResult, [], null, null, null);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.findMemberByUserAndCompany('company-uuid', 'non-member-uuid');

    expect(result).toBeNull();
  });
});

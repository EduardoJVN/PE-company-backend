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

function makeMockDb(createResult: CompanyResult) {
  const mockCreate = vi.fn().mockResolvedValue(createResult);
  const mockTx = { company: { create: mockCreate } };
  const mockDb = {
    $transaction: vi
      .fn()
      .mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  } as unknown as PrismaClient;

  return { mockDb, mockCreate };
}

describe('PrismaCompanyRepository', () => {
  let repo: PrismaCompanyRepository;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls company.create inside a transaction', async () => {
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

  it('creates sectors when sectorIds are provided', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.createWithOwner({ ...companyData, sectorIds: [1, 3] }, memberData);

    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.sectors).toEqual({ create: [{ sectorId: 1 }, { sectorId: 3 }] });
  });

  it('omits sectors when sectorIds is empty', async () => {
    const { mockDb, mockCreate } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    await repo.createWithOwner({ ...companyData, sectorIds: [] }, memberData);

    const callData = mockCreate.mock.calls[0][0].data;
    expect(callData.sectors).toBeUndefined();
  });

  it('returns the company result from the transaction', async () => {
    const { mockDb } = makeMockDb(dbResult);
    repo = new PrismaCompanyRepository(mockDb);

    const result = await repo.createWithOwner(companyData, memberData);

    expect(result).toEqual(dbResult);
  });
});

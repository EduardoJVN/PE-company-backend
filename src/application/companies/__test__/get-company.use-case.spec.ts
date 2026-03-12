import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetCompanyUseCase } from '@application/companies/get-company.use-case.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import type {
  ICompanyRepository,
  CompanyDetailResult,
} from '@domain/companies/ports/company-repository.port.js';
import { CompanyStatusId } from '@domain/catalog-ids.js';

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

const mockRepo: ICompanyRepository = {
  createWithOwner: vi.fn(),
  update: vi.fn(),
  findByMemberId: vi.fn(),
  findByIdForMember: vi.fn().mockResolvedValue(mockDetail),
  findMemberByUserAndCompany: vi.fn(),
  findMemberByUserAndCompanyAnyStatus: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  activateMember: vi.fn(),
  inviteMember: vi.fn(),
};

const baseInput = { companyId: 'company-uuid', userId: 'owner-uuid' };

describe('GetCompanyUseCase', () => {
  let useCase: GetCompanyUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetCompanyUseCase(mockRepo);
  });

  it('calls findByIdForMember with companyId and userId', async () => {
    await useCase.execute(baseInput);

    expect(vi.mocked(mockRepo.findByIdForMember)).toHaveBeenCalledWith(
      'company-uuid',
      'owner-uuid',
    );
  });

  it('returns the company detail on success', async () => {
    const result = await useCase.execute(baseInput);

    expect(result).toEqual(mockDetail);
  });

  it('throws CompanyNotFoundError when repo returns null', async () => {
    vi.mocked(mockRepo.findByIdForMember).mockResolvedValueOnce(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(CompanyNotFoundError);
  });

  it('throws CompanyNotFoundError when user is not a member', async () => {
    vi.mocked(mockRepo.findByIdForMember).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ companyId: 'company-uuid', userId: 'non-member-uuid' }),
    ).rejects.toThrow(CompanyNotFoundError);
  });
});

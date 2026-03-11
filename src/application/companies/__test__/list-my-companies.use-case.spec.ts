import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListMyCompaniesUseCase } from '@application/companies/list-my-companies.use-case.js';
import type {
  ICompanyRepository,
  CompanyResult,
} from '@domain/companies/ports/company-repository.port.js';
import { CompanyStatusId } from '@domain/catalog-ids.js';

const mockCompany: CompanyResult = {
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
  createWithOwner: vi.fn(),
  findByMemberId: vi.fn().mockResolvedValue([mockCompany]),
};

describe('ListMyCompaniesUseCase', () => {
  let useCase: ListMyCompaniesUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ListMyCompaniesUseCase(mockRepo);
  });

  it('calls findByMemberId with the given userId', async () => {
    await useCase.execute({ userId: 'user-uuid' });

    expect(vi.mocked(mockRepo.findByMemberId)).toHaveBeenCalledWith('user-uuid');
  });

  it('returns the list from the repository', async () => {
    const result = await useCase.execute({ userId: 'user-uuid' });

    expect(result).toEqual([mockCompany]);
  });

  it('returns empty array when user has no companies', async () => {
    vi.mocked(mockRepo.findByMemberId).mockResolvedValueOnce([]);

    const result = await useCase.execute({ userId: 'user-uuid' });

    expect(result).toEqual([]);
  });
});

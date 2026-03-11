import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivateCompanyMemberUseCase } from '@application/companies/activate-company-member.use-case.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { CompanyMemberNotFoundError } from '@domain/companies/errors/company-member-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import { MemberNotDeletedError } from '@domain/companies/errors/member-not-deleted.error.js';
import type {
  ICompanyRepository,
  CompanyMemberResult,
} from '@domain/companies/ports/company-repository.port.js';
import { CompanyMemberRoleId, CompanyMemberStatusId } from '@domain/catalog-ids.js';

const ownerMember: CompanyMemberResult = {
  id: 'owner-member-uuid',
  companyId: 'company-uuid',
  userId: 'owner-uuid',
  roleId: CompanyMemberRoleId.OWNER,
  statusId: CompanyMemberStatusId.ACTIVE,
  invitedAt: null,
  invitedBy: null,
  acceptedAt: null,
  acceptedBy: null,
};

const adminMember: CompanyMemberResult = {
  id: 'admin-member-uuid',
  companyId: 'company-uuid',
  userId: 'admin-uuid',
  roleId: CompanyMemberRoleId.ADMIN,
  statusId: CompanyMemberStatusId.ACTIVE,
  invitedAt: new Date('2026-01-01'),
  invitedBy: 'owner-uuid',
  acceptedAt: new Date('2026-01-02'),
  acceptedBy: 'admin-uuid',
};

const editorMember: CompanyMemberResult = {
  id: 'editor-member-uuid',
  companyId: 'company-uuid',
  userId: 'editor-uuid',
  roleId: CompanyMemberRoleId.EDITOR,
  statusId: CompanyMemberStatusId.ACTIVE,
  invitedAt: new Date('2026-01-01'),
  invitedBy: 'owner-uuid',
  acceptedAt: new Date('2026-01-02'),
  acceptedBy: 'editor-uuid',
};

const deletedMember: CompanyMemberResult = {
  ...editorMember,
  statusId: CompanyMemberStatusId.DELETED,
};

const mockRepo: ICompanyRepository = {
  createWithOwner: vi.fn(),
  update: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  activateMember: vi.fn().mockResolvedValue(undefined),
  findByMemberId: vi.fn(),
  findByIdForMember: vi.fn(),
  findMemberByUserAndCompany: vi.fn(),
  findMemberByUserAndCompanyAnyStatus: vi.fn(),
};

const baseInput = {
  companyId: 'company-uuid',
  requesterId: 'owner-uuid',
  targetUserId: 'editor-uuid',
};

describe('ActivateCompanyMemberUseCase', () => {
  let useCase: ActivateCompanyMemberUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(ownerMember);
    vi.mocked(mockRepo.findMemberByUserAndCompanyAnyStatus).mockResolvedValue(deletedMember);
    vi.mocked(mockRepo.activateMember).mockResolvedValue(undefined);
    useCase = new ActivateCompanyMemberUseCase(mockRepo);
  });

  it('resolves without error on successful reactivation', async () => {
    await expect(useCase.execute(baseInput)).resolves.toBeUndefined();
  });

  it('calls activateMember with target entity holding ACTIVE status', async () => {
    await useCase.execute(baseInput);

    const memberArg = vi.mocked(mockRepo.activateMember).mock.calls[0][0];
    expect(memberArg.id).toBe(deletedMember.id);
    expect(memberArg.statusId).toBe(CompanyMemberStatusId.ACTIVE);
  });

  it('uses findMemberByUserAndCompany for requester (ACTIVE filter)', async () => {
    await useCase.execute(baseInput);

    expect(vi.mocked(mockRepo.findMemberByUserAndCompany)).toHaveBeenCalledWith(
      'company-uuid',
      'owner-uuid',
    );
  });

  it('uses findMemberByUserAndCompanyAnyStatus for target (no status filter)', async () => {
    await useCase.execute(baseInput);

    expect(vi.mocked(mockRepo.findMemberByUserAndCompanyAnyStatus)).toHaveBeenCalledWith(
      'company-uuid',
      'editor-uuid',
    );
  });

  it('allows OWNER requester to reactivate a member', async () => {
    await expect(useCase.execute(baseInput)).resolves.not.toThrow();
  });

  it('allows ADMIN requester to reactivate a member', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(adminMember);

    await expect(
      useCase.execute({ ...baseInput, requesterId: 'admin-uuid' }),
    ).resolves.not.toThrow();
  });

  it('throws UnauthorizedCompanyAccessError when requester is EDITOR', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(editorMember);

    await expect(useCase.execute({ ...baseInput, requesterId: 'editor-uuid' })).rejects.toThrow(
      UnauthorizedCompanyAccessError,
    );
  });

  it('throws UnauthorizedCompanyAccessError when requester is VIEWER', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue({
      ...editorMember,
      userId: 'viewer-uuid',
      roleId: CompanyMemberRoleId.VIEWER,
    });

    await expect(useCase.execute({ ...baseInput, requesterId: 'viewer-uuid' })).rejects.toThrow(
      UnauthorizedCompanyAccessError,
    );
  });

  it('throws CompanyNotFoundError when requester is not an active member', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(CompanyNotFoundError);
  });

  it('throws CompanyMemberNotFoundError when target user does not exist', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompanyAnyStatus).mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(CompanyMemberNotFoundError);
  });

  it('throws MemberNotDeletedError when target is ACTIVE', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompanyAnyStatus).mockResolvedValue(editorMember);

    await expect(useCase.execute(baseInput)).rejects.toThrow(MemberNotDeletedError);
  });

  it('throws MemberNotDeletedError when target is SUSPENDED', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompanyAnyStatus).mockResolvedValue({
      ...editorMember,
      statusId: CompanyMemberStatusId.SUSPENDED,
    });

    await expect(useCase.execute(baseInput)).rejects.toThrow(MemberNotDeletedError);
  });

  it('does not call activateMember when authorization fails', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(editorMember);

    await useCase.execute({ ...baseInput, requesterId: 'editor-uuid' }).catch(() => undefined);

    expect(vi.mocked(mockRepo.activateMember)).not.toHaveBeenCalled();
  });
});

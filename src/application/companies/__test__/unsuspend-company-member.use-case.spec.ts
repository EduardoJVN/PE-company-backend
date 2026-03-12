import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnsuspendCompanyMemberUseCase } from '@application/companies/unsuspend-company-member.use-case.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { CompanyMemberNotFoundError } from '@domain/companies/errors/company-member-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import { MemberNotSuspendedError } from '@domain/companies/errors/member-not-suspended.error.js';
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

const suspendedMember: CompanyMemberResult = {
  ...editorMember,
  statusId: CompanyMemberStatusId.SUSPENDED,
};

const mockRepo: ICompanyRepository = {
  createWithOwner: vi.fn(),
  update: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  suspendMember: vi.fn(),
  unsuspendMember: vi.fn().mockResolvedValue(undefined),
  activateMember: vi.fn(),
  findByMemberId: vi.fn(),
  findByIdForMember: vi.fn(),
  findMemberByUserAndCompany: vi.fn(),
  findMemberByUserAndCompanyAnyStatus: vi.fn(),
  inviteMember: vi.fn(),
};

const baseInput = {
  companyId: 'company-uuid',
  requesterId: 'owner-uuid',
  targetUserId: 'editor-uuid',
};

describe('UnsuspendCompanyMemberUseCase', () => {
  let useCase: UnsuspendCompanyMemberUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(ownerMember);
    vi.mocked(mockRepo.findMemberByUserAndCompanyAnyStatus).mockResolvedValue(suspendedMember);
    vi.mocked(mockRepo.unsuspendMember).mockResolvedValue(undefined);
    useCase = new UnsuspendCompanyMemberUseCase(mockRepo);
  });

  it('resolves without error on successful unsuspension', async () => {
    await expect(useCase.execute(baseInput)).resolves.toBeUndefined();
  });

  it('calls unsuspendMember with target member entity holding ACTIVE status', async () => {
    await useCase.execute(baseInput);

    const memberArg = vi.mocked(mockRepo.unsuspendMember).mock.calls[0][0];
    expect(memberArg.id).toBe(suspendedMember.id);
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

  it('allows OWNER requester to unsuspend a member', async () => {
    await expect(useCase.execute(baseInput)).resolves.not.toThrow();
  });

  it('allows ADMIN requester to unsuspend a member', async () => {
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

  it('throws MemberNotSuspendedError when target is ACTIVE', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompanyAnyStatus).mockResolvedValue(editorMember);

    await expect(useCase.execute(baseInput)).rejects.toThrow(MemberNotSuspendedError);
  });

  it('throws MemberNotSuspendedError when target is DELETED', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompanyAnyStatus).mockResolvedValue({
      ...editorMember,
      statusId: CompanyMemberStatusId.DELETED,
    });

    await expect(useCase.execute(baseInput)).rejects.toThrow(MemberNotSuspendedError);
  });

  it('does not call unsuspendMember when authorization fails', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(editorMember);

    await useCase.execute({ ...baseInput, requesterId: 'editor-uuid' }).catch(() => undefined);

    expect(vi.mocked(mockRepo.unsuspendMember)).not.toHaveBeenCalled();
  });
});

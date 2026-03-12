import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeMemberRoleUseCase } from '@application/companies/change-member-role.use-case.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { CompanyMemberNotFoundError } from '@domain/companies/errors/company-member-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import { CannotChangeOwnerRoleError } from '@domain/companies/errors/cannot-change-owner-role.error.js';
import { CannotAssignOwnerRoleError } from '@domain/companies/errors/cannot-assign-owner-role.error.js';
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

const viewerMember: CompanyMemberResult = {
  ...editorMember,
  id: 'viewer-member-uuid',
  userId: 'viewer-uuid',
  roleId: CompanyMemberRoleId.VIEWER,
};

const updatedMemberResult: CompanyMemberResult = {
  ...editorMember,
  roleId: CompanyMemberRoleId.ADMIN,
};

const mockRepo: ICompanyRepository = {
  createWithOwner: vi.fn(),
  update: vi.fn(),
  updateMemberRole: vi.fn().mockResolvedValue(updatedMemberResult),
  findByMemberId: vi.fn(),
  findByIdForMember: vi.fn(),
  findMemberByUserAndCompany: vi.fn(),
  findMemberByUserAndCompanyAnyStatus: vi.fn(),
  removeMember: vi.fn(),
  suspendMember: vi.fn(),
  unsuspendMember: vi.fn(),
  activateMember: vi.fn(),
  inviteMember: vi.fn(),
};

const baseInput = {
  companyId: 'company-uuid',
  requesterId: 'owner-uuid',
  targetUserId: 'editor-uuid',
  newRoleId: CompanyMemberRoleId.ADMIN,
};

describe('ChangeMemberRoleUseCase', () => {
  let useCase: ChangeMemberRoleUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'owner-uuid') return ownerMember;
        if (userId === 'editor-uuid') return editorMember;
        return null;
      },
    );
    vi.mocked(mockRepo.updateMemberRole).mockResolvedValue(updatedMemberResult);
    useCase = new ChangeMemberRoleUseCase(mockRepo);
  });

  it('returns the updated member result', async () => {
    const result = await useCase.execute(baseInput);

    expect(result).toEqual(updatedMemberResult);
  });

  it('calls updateMemberRole with target member entity holding new roleId', async () => {
    await useCase.execute(baseInput);

    const memberArg = vi.mocked(mockRepo.updateMemberRole).mock.calls[0][0];
    expect(memberArg.id).toBe(editorMember.id);
    expect(memberArg.roleId).toBe(CompanyMemberRoleId.ADMIN);
  });

  it('allows OWNER requester to change a member role', async () => {
    await expect(useCase.execute(baseInput)).resolves.not.toThrow();
  });

  it('allows ADMIN requester to change a member role', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'admin-uuid') return adminMember;
        if (userId === 'editor-uuid') return editorMember;
        return null;
      },
    );

    await expect(
      useCase.execute({ ...baseInput, requesterId: 'admin-uuid' }),
    ).resolves.not.toThrow();
  });

  it('throws UnauthorizedCompanyAccessError when requester is EDITOR', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'editor-uuid') return editorMember;
        if (userId === 'viewer-uuid') return viewerMember;
        return null;
      },
    );

    await expect(
      useCase.execute({ ...baseInput, requesterId: 'editor-uuid', targetUserId: 'viewer-uuid' }),
    ).rejects.toThrow(UnauthorizedCompanyAccessError);
  });

  it('throws UnauthorizedCompanyAccessError when requester is VIEWER', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'viewer-uuid') return viewerMember;
        return null;
      },
    );

    await expect(useCase.execute({ ...baseInput, requesterId: 'viewer-uuid' })).rejects.toThrow(
      UnauthorizedCompanyAccessError,
    );
  });

  it('throws CompanyNotFoundError when requester is not a member of the company', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(CompanyNotFoundError);
  });

  it('throws CompanyMemberNotFoundError when target user is not a member', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'owner-uuid') return ownerMember;
        return null;
      },
    );

    await expect(
      useCase.execute({ ...baseInput, targetUserId: 'non-member-uuid' }),
    ).rejects.toThrow(CompanyMemberNotFoundError);
  });

  it('throws CannotChangeOwnerRoleError when target is the owner', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'owner-uuid') return ownerMember;
        if (userId === 'other-owner-uuid') return { ...ownerMember, userId: 'other-owner-uuid' };
        return null;
      },
    );

    await expect(
      useCase.execute({ ...baseInput, targetUserId: 'other-owner-uuid' }),
    ).rejects.toThrow(CannotChangeOwnerRoleError);
  });

  it('throws CannotAssignOwnerRoleError when trying to assign OWNER role', async () => {
    await expect(
      useCase.execute({ ...baseInput, newRoleId: CompanyMemberRoleId.OWNER }),
    ).rejects.toThrow(CannotAssignOwnerRoleError);
  });

  it('does not call updateMemberRole when authorization fails', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'editor-uuid') return editorMember;
        return null;
      },
    );

    await useCase.execute({ ...baseInput, requesterId: 'editor-uuid' }).catch(() => undefined);

    expect(vi.mocked(mockRepo.updateMemberRole)).not.toHaveBeenCalled();
  });
});

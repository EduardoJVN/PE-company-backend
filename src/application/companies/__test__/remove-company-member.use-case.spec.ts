import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemoveCompanyMemberUseCase } from '@application/companies/remove-company-member.use-case.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { CompanyMemberNotFoundError } from '@domain/companies/errors/company-member-not-found.error.js';
import { CannotRemoveOwnerError } from '@domain/companies/errors/cannot-remove-owner.error.js';
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

const mockRepo: ICompanyRepository = {
  createWithOwner: vi.fn(),
  update: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn().mockResolvedValue(undefined),
  findByMemberId: vi.fn(),
  findByIdForMember: vi.fn(),
  findMemberByUserAndCompany: vi.fn(),
};

const baseInput = {
  companyId: 'company-uuid',
  requesterId: 'owner-uuid',
  targetUserId: 'editor-uuid',
};

describe('RemoveCompanyMemberUseCase', () => {
  let useCase: RemoveCompanyMemberUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'owner-uuid') return ownerMember;
        if (userId === 'editor-uuid') return editorMember;
        return null;
      },
    );
    useCase = new RemoveCompanyMemberUseCase(mockRepo);
  });

  it('resolves without error on successful removal', async () => {
    await expect(useCase.execute(baseInput)).resolves.toBeUndefined();
  });

  it('calls removeMember with target member entity holding DELETED status', async () => {
    await useCase.execute(baseInput);

    const memberArg = vi.mocked(mockRepo.removeMember).mock.calls[0][0];
    expect(memberArg.id).toBe(editorMember.id);
    expect(memberArg.statusId).toBe(CompanyMemberStatusId.DELETED);
  });

  it('allows OWNER requester to remove a member', async () => {
    await expect(useCase.execute(baseInput)).resolves.not.toThrow();
  });

  it('allows ADMIN requester to remove a member', async () => {
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

  it('allows EDITOR requester to remove a member', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'editor-uuid') return editorMember;
        if (userId === 'viewer-uuid') return viewerMember;
        return null;
      },
    );

    await expect(
      useCase.execute({ ...baseInput, requesterId: 'editor-uuid', targetUserId: 'viewer-uuid' }),
    ).resolves.not.toThrow();
  });

  it('allows VIEWER requester to remove a member', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'viewer-uuid') return viewerMember;
        if (userId === 'editor-uuid') return editorMember;
        return null;
      },
    );

    await expect(
      useCase.execute({ ...baseInput, requesterId: 'viewer-uuid', targetUserId: 'editor-uuid' }),
    ).resolves.not.toThrow();
  });

  it('throws CompanyNotFoundError when requester is not a company member', async () => {
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

  it('throws CannotRemoveOwnerError when target is the owner', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'owner-uuid') return ownerMember;
        if (userId === 'other-owner-uuid') return { ...ownerMember, userId: 'other-owner-uuid' };
        return null;
      },
    );

    await expect(
      useCase.execute({ ...baseInput, targetUserId: 'other-owner-uuid' }),
    ).rejects.toThrow(CannotRemoveOwnerError);
  });

  it('does not call removeMember when requester is not a member of the company', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(null);

    await useCase.execute(baseInput).catch(() => undefined);

    expect(vi.mocked(mockRepo.removeMember)).not.toHaveBeenCalled();
  });
});

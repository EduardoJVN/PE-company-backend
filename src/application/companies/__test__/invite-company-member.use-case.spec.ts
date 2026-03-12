import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InviteCompanyMemberUseCase } from '@application/companies/invite-company-member.use-case.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import { MemberAlreadyInCompanyError } from '@domain/companies/errors/member-already-in-company.error.js';
import type {
  ICompanyRepository,
  CompanyMemberResult,
} from '@domain/companies/ports/company-repository.port.js';
import type { IUserPort, UserResult } from '@domain/users/ports/user.port.js';
import type { IEmailSender } from '@domain/ports/email-sender.port.js';
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

const editorMember: CompanyMemberResult = {
  id: 'editor-member-uuid',
  companyId: 'company-uuid',
  userId: 'editor-uuid',
  roleId: CompanyMemberRoleId.EDITOR,
  statusId: CompanyMemberStatusId.ACTIVE,
  invitedAt: new Date('2026-01-01'),
  invitedBy: 'owner-uuid',
  acceptedAt: new Date('2026-01-01'),
  acceptedBy: 'owner-uuid',
};

const newUserResult: UserResult = {
  id: 'new-user-uuid',
  email: 'new@example.com',
  statusId: 4,
};

const existingUserResult: UserResult = {
  id: 'existing-user-uuid',
  email: 'existing@example.com',
  statusId: 2,
};

const invitedMemberResult: CompanyMemberResult = {
  id: 'new-member-uuid',
  companyId: 'company-uuid',
  userId: 'new-user-uuid',
  roleId: CompanyMemberRoleId.EDITOR,
  statusId: CompanyMemberStatusId.ACTIVE,
  invitedAt: new Date(),
  invitedBy: 'owner-uuid',
  acceptedAt: new Date(),
  acceptedBy: 'owner-uuid',
};

const mockRepo: ICompanyRepository = {
  createWithOwner: vi.fn(),
  update: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  activateMember: vi.fn(),
  findByMemberId: vi.fn(),
  findByIdForMember: vi.fn(),
  findMemberByUserAndCompany: vi.fn(),
  findMemberByUserAndCompanyAnyStatus: vi.fn(),
  inviteMember: vi.fn().mockResolvedValue(invitedMemberResult),
};

const mockUserPort: IUserPort = {
  findByEmail: vi.fn(),
  createInvited: vi.fn(),
  upsertInviteToken: vi.fn().mockResolvedValue(undefined),
};

const mockEmailSender: IEmailSender = {
  send: vi.fn().mockResolvedValue(undefined),
};

const baseInput = {
  companyId: 'company-uuid',
  requesterId: 'owner-uuid',
  email: 'new@example.com',
  roleId: CompanyMemberRoleId.EDITOR,
  frontendUrl: 'https://app.example.com',
};

describe('InviteCompanyMemberUseCase', () => {
  let useCase: InviteCompanyMemberUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'owner-uuid') return ownerMember;
        return null;
      },
    );
    vi.mocked(mockRepo.inviteMember).mockResolvedValue(invitedMemberResult);
    vi.mocked(mockUserPort.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserPort.createInvited).mockResolvedValue(newUserResult);
    vi.mocked(mockUserPort.upsertInviteToken).mockResolvedValue(undefined);
    vi.mocked(mockEmailSender.send).mockResolvedValue(undefined);
    useCase = new InviteCompanyMemberUseCase(mockRepo, mockUserPort, mockEmailSender);
  });

  it('returns the new member result', async () => {
    const result = await useCase.execute(baseInput);

    expect(result).toEqual(invitedMemberResult);
  });

  it('creates a new user when email does not exist', async () => {
    vi.mocked(mockUserPort.findByEmail).mockResolvedValue(null);

    await useCase.execute(baseInput);

    expect(vi.mocked(mockUserPort.createInvited)).toHaveBeenCalledOnce();
  });

  it('does not create a user when email already exists', async () => {
    vi.mocked(mockUserPort.findByEmail).mockResolvedValue(existingUserResult);

    await useCase.execute({ ...baseInput, email: 'existing@example.com' });

    expect(vi.mocked(mockUserPort.createInvited)).not.toHaveBeenCalled();
  });

  it('calls inviteMember with a member entity bearing the correct companyId and roleId', async () => {
    await useCase.execute(baseInput);

    const memberArg = vi.mocked(mockRepo.inviteMember).mock.calls[0][0];
    expect(memberArg.companyId).toBe('company-uuid');
    expect(memberArg.roleId).toBe(CompanyMemberRoleId.EDITOR);
    expect(memberArg.invitedBy).toBe('owner-uuid');
    expect(memberArg.acceptedBy).toBe('owner-uuid');
  });

  it('stores an invite token for the user', async () => {
    await useCase.execute(baseInput);

    expect(vi.mocked(mockUserPort.upsertInviteToken)).toHaveBeenCalledOnce();
    const [, userId, tokenHash, expiresAt] = vi.mocked(mockUserPort.upsertInviteToken).mock
      .calls[0];
    expect(userId).toBe(newUserResult.id);
    expect(typeof tokenHash).toBe('string');
    expect(tokenHash).toHaveLength(64); // sha256 hex
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('sends an invite email to the invited address', async () => {
    await useCase.execute(baseInput);

    expect(vi.mocked(mockEmailSender.send)).toHaveBeenCalledOnce();
    const emailArg = vi.mocked(mockEmailSender.send).mock.calls[0][0];
    expect(emailArg.to).toBe('new@example.com');
    expect(emailArg.html).toContain('https://app.example.com/invite/accept');
    expect(emailArg.html).toContain('company-uuid');
  });

  it('allows ADMIN requester to invite a member', async () => {
    const adminMember: CompanyMemberResult = {
      ...ownerMember,
      id: 'admin-member-uuid',
      userId: 'admin-uuid',
      roleId: CompanyMemberRoleId.ADMIN,
    };
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(adminMember);

    await expect(
      useCase.execute({ ...baseInput, requesterId: 'admin-uuid' }),
    ).resolves.not.toThrow();
  });

  it('throws CompanyNotFoundError when requester is not a member', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(CompanyNotFoundError);
  });

  it('throws UnauthorizedCompanyAccessError when requester is EDITOR', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(editorMember);

    await expect(useCase.execute({ ...baseInput, requesterId: 'editor-uuid' })).rejects.toThrow(
      UnauthorizedCompanyAccessError,
    );
  });

  it('throws MemberAlreadyInCompanyError when existing user is already a member', async () => {
    const existingMember: CompanyMemberResult = {
      ...editorMember,
      userId: 'existing-user-uuid',
    };
    vi.mocked(mockUserPort.findByEmail).mockResolvedValue(existingUserResult);
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockImplementation(
      async (_companyId, userId) => {
        if (userId === 'owner-uuid') return ownerMember;
        if (userId === 'existing-user-uuid') return existingMember;
        return null;
      },
    );

    await expect(useCase.execute({ ...baseInput, email: 'existing@example.com' })).rejects.toThrow(
      MemberAlreadyInCompanyError,
    );
  });

  it('does not send email when authorization fails', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(null);

    await useCase.execute(baseInput).catch(() => undefined);

    expect(vi.mocked(mockEmailSender.send)).not.toHaveBeenCalled();
  });

  it('does not call inviteMember when authorization fails', async () => {
    vi.mocked(mockRepo.findMemberByUserAndCompany).mockResolvedValue(null);

    await useCase.execute(baseInput).catch(() => undefined);

    expect(vi.mocked(mockRepo.inviteMember)).not.toHaveBeenCalled();
  });
});

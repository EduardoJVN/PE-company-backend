import { randomBytes, createHash } from 'node:crypto';
import { uuidv7 } from 'uuidv7';
import { CompanyMember } from '@domain/companies/entities/company-member.entity.js';
import { CompanyNotFoundError } from '@domain/companies/errors/company-not-found.error.js';
import { UnauthorizedCompanyAccessError } from '@domain/companies/errors/unauthorized-company-access.error.js';
import { MemberAlreadyInCompanyError } from '@domain/companies/errors/member-already-in-company.error.js';
import type {
  ICompanyRepository,
  CompanyMemberResult,
} from '@domain/companies/ports/company-repository.port.js';
import type { IUserPort } from '@domain/users/ports/user.port.js';
import type { IEmailSender } from '@domain/ports/email-sender.port.js';
import { buildCompanyInviteEmail } from '@application/companies/emails/company-invite.email.js';

const INVITE_TOKEN_TTL_DAYS = 7;

export interface InviteCompanyMemberInput {
  companyId: string;
  requesterId: string;
  email: string;
  roleId: number;
  frontendUrl: string;
}

export class InviteCompanyMemberUseCase {
  constructor(
    private readonly companyRepo: ICompanyRepository,
    private readonly userPort: IUserPort,
    private readonly emailSender: IEmailSender,
  ) {}

  async execute(input: InviteCompanyMemberInput): Promise<CompanyMemberResult> {
    const requesterResult = await this.companyRepo.findMemberByUserAndCompany(
      input.companyId,
      input.requesterId,
    );

    if (!requesterResult) throw new CompanyNotFoundError(input.companyId);

    const requester = CompanyMember.reconstitute(
      requesterResult.id,
      requesterResult.companyId,
      requesterResult.userId,
      requesterResult.roleId,
      requesterResult.statusId,
      requesterResult.invitedAt,
      requesterResult.invitedBy,
      requesterResult.acceptedAt,
      requesterResult.acceptedBy,
    );

    if (!requester.canManageMembers()) throw new UnauthorizedCompanyAccessError(input.companyId);

    let user = await this.userPort.findByEmail(input.email);

    if (user) {
      const existing = await this.companyRepo.findMemberByUserAndCompany(input.companyId, user.id);
      if (existing) throw new MemberAlreadyInCompanyError(input.email);
    } else {
      user = await this.userPort.createInvited(uuidv7(), input.email);
    }

    const member = CompanyMember.createInvited(
      uuidv7(),
      input.companyId,
      user.id,
      input.roleId,
      input.requesterId,
    );

    const savedMember = await this.companyRepo.inviteMember(member);

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.userPort.upsertInviteToken(uuidv7(), user.id, tokenHash, expiresAt);

    const inviteUrl = `${input.frontendUrl}/invite/accept?token=${rawToken}&companyId=${input.companyId}`;

    await this.emailSender.send({
      to: input.email,
      subject: 'Te invitaron a unirte a una empresa',
      html: buildCompanyInviteEmail(inviteUrl),
    });

    return savedMember;
  }
}

import { z } from 'zod';
import { CompanyMemberRoleId } from '@domain/catalog-ids.js';

export const inviteMemberBodySchema = z.object({
  email: z.string().email({ message: 'email must be a valid email address' }),
  roleId: z
    .number()
    .int()
    .refine(
      (v) =>
        v === CompanyMemberRoleId.ADMIN ||
        v === CompanyMemberRoleId.EDITOR ||
        v === CompanyMemberRoleId.VIEWER,
      { message: 'roleId must be a valid assignable role (admin, editor, or viewer)' },
    ),
});

export type InviteMemberBody = z.infer<typeof inviteMemberBodySchema>;

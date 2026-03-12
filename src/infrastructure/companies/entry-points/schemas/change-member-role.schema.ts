import { z } from 'zod';
import { CompanyMemberRoleId } from '@domain/catalog-ids.js';

export const changeMemberRoleBodySchema = z.object({
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

export type ChangeMemberRoleBody = z.infer<typeof changeMemberRoleBodySchema>;

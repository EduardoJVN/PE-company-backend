/**
 * Catalog IDs — lookup table values seeded in prisma/seed.ts.
 *
 * These constants map human-readable domain names to their integer PKs
 * in the database. Use these instead of magic numbers throughout the codebase.
 *
 * Source of truth: prisma/seed.ts
 */

export const UserStatusId = {
  PENDING: 1,
  ACTIVE: 2,
  SUSPENDED: 3,
  CHANGE_PASSWORD: 4, //este status significa que fue invitado por un admin u owner y debe cambiar su contraseña para terminar el registro de usuario, despues debe ir por el flujo normal de register
  INACTIVE: 5,
} as const;

export type UserStatusId = (typeof UserStatusId)[keyof typeof UserStatusId];

export const UserRoleId = {
  USER: 1,
  ADMIN: 2,
  SUPPORT: 3,
} as const;

export type UserRoleId = (typeof UserRoleId)[keyof typeof UserRoleId];

export const RegisterTypeId = {
  EMAIL: 1,
  GOOGLE: 2,
  FACEBOOK: 3,
} as const;

export type RegisterTypeId = (typeof RegisterTypeId)[keyof typeof RegisterTypeId];

export const CompanyMemberRoleId = {
  OWNER: 1,
  ADMIN: 2,
  EDITOR: 3,
  VIEWER: 4,
} as const;

export type CompanyMemberRoleId = (typeof CompanyMemberRoleId)[keyof typeof CompanyMemberRoleId];

export const CompanyStatusId = {
  ACTIVE: 1,
  PENDING_VERIFIED: 2,
  VERIFIED: 3,
  SUSPENDED: 4,
  INACTIVE: 5,
} as const;

export type CompanyStatusId = (typeof CompanyStatusId)[keyof typeof CompanyStatusId];

export const CompanyMemberStatusId = {
  PENDING: 1,
  ACTIVE: 2,
  SUSPENDED: 3,
  INACTIVE: 4,
  REJECTED: 5,
  DELETED: 6,
} as const;

export type CompanyMemberStatus =
  (typeof CompanyMemberStatusId)[keyof typeof CompanyMemberStatusId];

// products
export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}
export const CategoryProductsId = {
  PENDING: 1,
  ACTIVE: 2,
  SUSPENDED: 3,
  INACTIVE: 4,
  REJECTED: 5,
  DELETED: 6,
} as const;

export type CategoryProductsId = (typeof CategoryProductsId)[keyof typeof CategoryProductsId];
// products

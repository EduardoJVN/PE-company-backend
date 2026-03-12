export interface UserResult {
  id: string;
  email: string;
  statusId: number;
}

export interface IUserPort {
  findByEmail(email: string): Promise<UserResult | null>;
  createInvited(id: string, email: string): Promise<UserResult>;
  upsertInviteToken(id: string, userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
}

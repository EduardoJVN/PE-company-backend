export interface CreateCompanyData {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  statusId: number;
  sectorIds?: number[];
}

export interface CreateMemberData {
  id: string;
  companyId: string;
  userId: string;
  roleId: number;
  statusId: number;
}

export interface CompanyResult {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  statusId: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface ICompanyRepository {
  createWithOwner(company: CreateCompanyData, member: CreateMemberData): Promise<CompanyResult>;
}

import { CompanyStatusId } from '@domain/catalog-ids.js';
import { InvalidCompanyNameError } from '@domain/companies/errors/invalid-company-name.error.js';
import { InvalidSectorIdsError } from '@domain/companies/errors/invalid-sector-ids.error.js';

export class Company {
  private constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly logoUrl: string | null,
    public readonly statusId: number,
    public readonly sectorIds: number[],
    public readonly isActive: boolean,
    public readonly isVerified: boolean,
    public readonly verifiedAt: Date | null,
    public readonly verifiedBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  static create(
    id: string,
    ownerId: string,
    name: string,
    sectorIds: number[],
    description?: string,
    logoUrl?: string,
  ): Company {
    if (name.trim() === '') throw new InvalidCompanyNameError();
    if (sectorIds.length === 0) throw new InvalidSectorIdsError();

    const now = new Date();
    return new Company(
      id,
      ownerId,
      name,
      description ?? null,
      logoUrl ?? null,
      CompanyStatusId.ACTIVE,
      sectorIds,
      true,
      false,
      null,
      null,
      now,
      now,
      null,
    );
  }

  update(name: string, description?: string | null, logoUrl?: string | null): Company {
    if (name.trim() === '') throw new InvalidCompanyNameError();
    return new Company(
      this.id,
      this.ownerId,
      name,
      description !== undefined ? description : this.description,
      logoUrl !== undefined ? logoUrl : this.logoUrl,
      this.statusId,
      this.sectorIds,
      this.isActive,
      this.isVerified,
      this.verifiedAt,
      this.verifiedBy,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  static reconstitute(
    id: string,
    ownerId: string,
    name: string,
    description: string | null,
    logoUrl: string | null,
    statusId: number,
    sectorIds: number[],
    isActive: boolean,
    isVerified: boolean,
    verifiedAt: Date | null,
    verifiedBy: string | null,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Company {
    return new Company(
      id,
      ownerId,
      name,
      description,
      logoUrl,
      statusId,
      sectorIds,
      isActive,
      isVerified,
      verifiedAt,
      verifiedBy,
      createdAt,
      updatedAt,
      deletedAt,
    );
  }
}

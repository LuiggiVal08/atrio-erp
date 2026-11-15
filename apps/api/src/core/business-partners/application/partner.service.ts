import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PARTNER_REPOSITORY } from '../domain/partner.repository.interface';
import type { PartnerRepository, CreatePartnerData, UpdatePartnerData, PartnerFilters } from '../domain/partner.repository.interface';
import type { Partner, PartnerWithRelations, PartnerSummary, PartnerRoleType } from '../domain/partner.entity';

@Injectable()
export class PartnerService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PARTNER_REPOSITORY) private readonly partnerRepository: PartnerRepository,
  ) {}

  async findPartnersByRole(
    tenantId: string,
    role: PartnerRoleType,
    filter?: { search?: string; page?: number; pageSize?: number },
  ) {
    const filters: PartnerFilters = {
      tenantId,
      roles: [role],
      search: filter?.search,
      page: filter?.page ?? 1,
      pageSize: filter?.pageSize ?? 100,
    };
    return this.partnerRepository.findMany(filters);
  }

  async findPartnerById(id: string): Promise<PartnerWithRelations | null> {
    return this.partnerRepository.findById(id);
  }

  async findPartnerByLegacyId(legacyType: string, legacyId: string): Promise<PartnerWithRelations | null> {
    const mapEntry = await this.prisma.partnerMigrationMap.findUnique({
      where: { legacyType_legacyId: { legacyType, legacyId } },
    });
    if (mapEntry) {
      return this.partnerRepository.findById(mapEntry.partnerId);
    }
    return null;
  }

  async resolvePartnerId(legacyType: string, legacyId: string): Promise<string> {
    const mapEntry = await this.prisma.partnerMigrationMap.findUnique({
      where: { legacyType_legacyId: { legacyType, legacyId } },
    });
    return mapEntry?.partnerId ?? legacyId;
  }

  async createPartner(data: CreatePartnerData): Promise<Partner> {
    try {
      return await this.partnerRepository.create(data);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Partner already exists');
      throw error;
    }
  }

  async updatePartner(id: string, data: UpdatePartnerData): Promise<Partner> {
    const partner = await this.partnerRepository.findById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    return this.partnerRepository.update(id, data);
  }

  async softDeletePartner(id: string, updatedById: string): Promise<void> {
    const partner = await this.partnerRepository.findById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    await this.partnerRepository.softDelete(id, updatedById);
  }

  async assignRole(partnerId: string, role: PartnerRoleType): Promise<void> {
    await this.partnerRepository.assignRole(partnerId, role);
  }

  async getLegacyType(legacyType: string): Promise<PartnerRoleType> {
    return legacyType === 'client' ? 'CUSTOMER' : 'SUPPLIER';
  }
}

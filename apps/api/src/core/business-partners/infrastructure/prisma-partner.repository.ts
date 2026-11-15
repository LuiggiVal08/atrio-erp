import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { PartnerRepository, CreatePartnerData, UpdatePartnerData, PartnerFilters, CreateContactData, UpdateContactData, CreateAddressData, UpdateAddressData } from '../domain/partner.repository.interface';
import type { Partner, PartnerWithRelations, PartnerSummary, PartnerRoleType, PartnerRoleRelation, PartnerTagRelation, PartnerCategoryRelation, ContactRelation, AddressRelation } from '../domain/partner.entity';

@Injectable()
export class PrismaPartnerRepository implements PartnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async withTransaction<T>(work: (repository: PartnerRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => work(new PrismaPartnerRepository(tx as PrismaService)));
  }

  async create(data: CreatePartnerData): Promise<Partner> {
    const { roles, tags, categoryIds, taxId, contacts, addresses, clientIdentity, ...fields } = data;
    const partner = await this.prisma.partner.create({
      data: {
        ...fields,
        contacts: contacts?.length ? { create: contacts } : undefined,
        addresses: addresses?.length ? { create: addresses } : undefined,
        events: clientIdentity ? { create: {
          eventType: 'compatibility.client.identity', payload: clientIdentity, createdById: data.createdById,
        } } : undefined,
        taxIdValue: taxId?.value ?? null,
        taxIdCountry: taxId?.country ?? null,
        taxIdType: taxId?.type ?? null,
        roles: roles?.length
          ? { create: roles.map((role) => ({ role })) }
          : { create: { role: 'PROSPECT' as any } },
        tags: tags?.length
          ? { create: tags.map((value) => ({ value })) }
          : undefined,
        categories: categoryIds?.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
    });
    return partner as any;
  }

  async findById(id: string): Promise<PartnerWithRelations | null> {
    const row = await this.prisma.partner.findUnique({
      where: { id, deletedAt: null },
      include: {
        roles: true,
        tags: true,
        events: { where: { eventType: 'compatibility.client.identity' }, orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }], take: 1 },
        categories: { include: { category: { select: { id: true, name: true } } } },
        contacts: { where: { deletedAt: null } },
        addresses: { where: { deletedAt: null } },
      },
    });
    if (!row) return null;
    return this.toPartnerWithRelations(row);
  }

  async findMany(filters: PartnerFilters): Promise<{ data: PartnerSummary[]; total: number; page: number; pageSize: number }> {
    const { tenantId, search, roles, types, statuses, tags, categoryIds, page = 1, pageSize = 50, sortBy = 'legalName', sortOrder = 'asc' } = filters;
    const where: any = { tenantId, deletedAt: null };
    if (types?.length) where.type = { in: types };
    if (statuses?.length) where.status = { in: statuses };
    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: 'insensitive' } },
        { commercialName: { contains: search, mode: 'insensitive' } },
        { taxIdValue: { contains: search } },
      ];
    }
    if (roles?.length) {
      where.roles = { some: { role: { in: roles } } };
    }
    if (tags?.length) {
      where.tags = { some: { value: { in: tags } } };
    }
    if (categoryIds?.length) {
      where.categories = { some: { categoryId: { in: categoryIds } } };
    }

    const orderMap: Record<string, string> = { legalName: 'legalName', createdAt: 'createdAt', status: 'status' };
    const orderBy = { [orderMap[sortBy] || 'legalName']: sortOrder };

    const [rows, total] = await Promise.all([
      this.prisma.partner.findMany({
        where,
        include: {
          roles: true,
          tags: true,
          categories: { include: { category: { select: { id: true, name: true } } } },
          contacts: { where: { deletedAt: null, isPrimary: true }, take: 1 },
        },
        orderBy: [orderBy, { id: 'asc' }] as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.partner.count({ where }),
    ]);

    return {
      data: rows.map((row: any) => this.toPartnerSummary(row)),
      total,
      page,
      pageSize,
    };
  }

  async update(id: string, data: UpdatePartnerData): Promise<Partner> {
    const { taxId, categoryIds, ...fields } = data;
    const updateData: any = { ...fields };
    if (taxId !== undefined) {
      updateData.taxIdValue = taxId?.value ?? null;
      updateData.taxIdCountry = taxId?.country ?? null;
      updateData.taxIdType = taxId?.type ?? null;
    }
    const partner = await this.prisma.partner.update({ where: { id }, data: updateData });
    if (categoryIds !== undefined) {
      await this.prisma.partnerCategory.deleteMany({ where: { partnerId: id } });
      if (categoryIds.length) {
        await this.prisma.partnerCategory.createMany({
          data: categoryIds.map((categoryId) => ({ partnerId: id, categoryId })),
          skipDuplicates: true,
        });
      }
    }
    return partner as any;
  }

  async softDelete(id: string, updatedById: string): Promise<void> {
    await this.prisma.partner.update({
      where: { id },
      data: { status: 'ARCHIVED' as any, deletedAt: new Date(), updatedById },
    });
  }

  async restore(id: string, updatedById: string): Promise<Partner> {
    const partner = await this.prisma.partner.update({
      where: { id },
      data: { status: 'ACTIVE' as any, deletedAt: null, updatedById },
    });
    return partner as any;
  }

  async assignRole(partnerId: string, role: PartnerRoleType): Promise<void> {
    await this.prisma.partnerRole.create({ data: { partnerId, role: role as any } });
  }

  async removeRole(partnerId: string, role: PartnerRoleType): Promise<void> {
    await this.prisma.partnerRole.delete({ where: { partnerId_role: { partnerId, role: role as any } } });
  }

  async addTags(partnerId: string, tags: string[]): Promise<void> {
    const data = tags.map((value) => ({ partnerId, value }));
    await this.prisma.partnerTag.createMany({ data, skipDuplicates: true });
  }

  async removeTags(partnerId: string, tags: string[]): Promise<void> {
    await this.prisma.partnerTag.deleteMany({ where: { partnerId, value: { in: tags } } });
  }

  async addContact(data: CreateContactData): Promise<{ id: string }> {
    const contact = await this.prisma.contact.create({ data: data as any, select: { id: true } });
    if (data.isPrimary) {
      await this.prisma.contact.updateMany({
        where: { partnerId: data.partnerId, id: { not: contact.id }, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return contact;
  }

  async updateContact(id: string, data: UpdateContactData): Promise<void> {
    await this.prisma.contact.update({ where: { id }, data: data as any });
  }

  async softDeleteContact(id: string): Promise<void> {
    await this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addAddress(data: CreateAddressData): Promise<{ id: string }> {
    const address = await this.prisma.partnerAddress.create({ data: data as any, select: { id: true } });
    if (data.isPrimary) {
      await this.prisma.partnerAddress.updateMany({
        where: { partnerId: data.partnerId, id: { not: address.id }, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return address;
  }

  async updateAddress(id: string, data: UpdateAddressData): Promise<void> {
    await this.prisma.partnerAddress.update({ where: { id }, data: data as any });
  }

  async softDeleteAddress(id: string): Promise<void> {
    await this.prisma.partnerAddress.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addEvent(partnerId: string, eventType: string, payload: Record<string, unknown>, createdById: string): Promise<void> {
    await this.prisma.partnerEvent.create({ data: { partnerId, eventType, payload: payload as any, createdById } });
  }

  async findEvents(partnerId: string): Promise<{ id: string; eventType: string; payload: Record<string, unknown>; occurredAt: Date }[]> {
    return this.prisma.partnerEvent.findMany({
      where: { partnerId },
      orderBy: { occurredAt: 'desc' },
      select: { id: true, eventType: true, payload: true, occurredAt: true },
    }) as any;
  }

  async findByTaxId(tenantId: string, taxId: { value: string; country: string; type: string }): Promise<Partner | null> {
    const row = await this.prisma.partner.findFirst({
      where: { tenantId, taxIdValue: taxId.value, taxIdCountry: taxId.country, taxIdType: taxId.type, deletedAt: null },
    });
    return row as any;
  }

  private toPartnerWithRelations(row: any): PartnerWithRelations {
    return {
      id: row.id,
      tenantId: row.tenantId,
      type: row.type,
      legalName: row.legalName,
      taxId: row.taxIdValue ? { value: row.taxIdValue, country: row.taxIdCountry, type: row.taxIdType } : null,
      commercialName: row.commercialName,
      website: row.website,
      paymentTerms: row.paymentTerms,
      deliveryDays: row.deliveryDays,
      status: row.status,
      metadataSource: row.metadataSource,
      metadataNotes: row.metadataNotes,
      externalId: row.externalId,
      createdById: row.createdById,
      updatedById: row.updatedById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      clientIdentity: row.events?.[0]?.payload ?? undefined,
      roles: (row.roles ?? []).map((r: any): PartnerRoleRelation => ({ role: r.role, assignedAt: r.assignedAt })),
      tags: (row.tags ?? []).map((t: any): PartnerTagRelation => ({ value: t.value })),
      categories: (row.categories ?? []).map((c: any): PartnerCategoryRelation => ({ categoryId: c.categoryId, name: c.category?.name ?? '' })),
      contacts: (row.contacts ?? []).map((c: any): ContactRelation => ({
        id: c.id, fullName: c.fullName, position: c.position, email: c.email, phone: c.phone, mobile: c.mobile,
        identificationType: c.identificationType ?? null, identificationNumber: c.identificationNumber ?? null,
        isPrimary: c.isPrimary, deletedAt: c.deletedAt,
      })),
      addresses: (row.addresses ?? []).map((a: any): AddressRelation => ({
        id: a.id, type: a.type, line1: a.line1, line2: a.line2, city: a.city, state: a.state, country: a.country, postalCode: a.postalCode, isPrimary: a.isPrimary, deletedAt: a.deletedAt,
      })),
    };
  }

  private toPartnerSummary(row: any): PartnerSummary {
    const primaryContact = row.contacts?.[0] ?? null;
    return {
      id: row.id,
      type: row.type,
      legalName: row.legalName,
      commercialName: row.commercialName,
      taxId: row.taxIdValue ? { value: row.taxIdValue, country: row.taxIdCountry, type: row.taxIdType } : null,
      status: row.status,
      roles: (row.roles ?? []).map((r: any) => r.role),
      tags: (row.tags ?? []).map((t: any) => t.value),
      categories: (row.categories ?? []).map((c: any) => ({ categoryId: c.categoryId, name: c.category?.name ?? '' })),
      primaryContact: primaryContact ? { fullName: primaryContact.fullName, email: primaryContact.email, phone: primaryContact.phone } : null,
      createdAt: row.createdAt,
    };
  }
}

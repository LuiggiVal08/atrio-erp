import { Injectable, Inject, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PartnerService } from '@/core/business-partners/application/partner.service';
import { PARTNER_REPOSITORY } from '@/core/business-partners/domain/partner.repository.interface';
import type { PartnerRepository, CreatePartnerData } from '@/core/business-partners/domain/partner.repository.interface';
import type { ClientVendorRepository, CreateClientData, CreateVendorData, CreateVendorContactData, UpdateVendorData, UpdateVendorContactData } from '../domain/client-vendor.repository.interface';
import { Client } from '../domain/client.entity';
import { Vendor } from '../domain/vendor.entity';
import { PartnerToClientMapper } from './partner-to-client.mapper';
import { PartnerToVendorMapper } from './partner-to-vendor.mapper';
import { COMPATIBILITY_METRICS_REPOSITORY } from './compatibility-metrics.repository.interface';
import type { CompatibilityMetricsRepository } from './compatibility-metrics.repository.interface';

@Injectable()
export class PartnerCompatibilityAdapter implements ClientVendorRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partnerService: PartnerService,
    @Inject(PARTNER_REPOSITORY) private readonly partnerRepository: PartnerRepository,
    private readonly clientMapper: PartnerToClientMapper,
    private readonly vendorMapper: PartnerToVendorMapper,
    @Inject(COMPATIBILITY_METRICS_REPOSITORY) private readonly metrics: CompatibilityMetricsRepository,
  ) {}

  async createClient(data: CreateClientData): Promise<Client> {
    const actorId = data.createdById ?? await this.getSystemUserId(data.tenantId);
    const createData: CreatePartnerData = {
      tenantId: data.tenantId,
      type: this.vendorMapper.determineType(data),
      legalName: data.legalName,
      taxId: { value: data.taxId, country: 'VE', type: data.identificationType ?? '' },
      commercialName: null,
      status: 'ACTIVE',
      metadataSource: 'client',
      metadataNotes: data.contributorType ? `Contributor: ${data.contributorType}` : null,
      externalId: data.documentId,
      createdById: actorId,
      updatedById: actorId,
      roles: ['CUSTOMER'],
    };

    const partner = await this.partnerService.createPartner(createData);
    this.metrics.trackClientWrite();
    const withRelations = await this.partnerRepository.findById(partner.id);
    return this.clientMapper.toClient(withRelations!);
  }

  async findAllClients(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Client[]> {
    const summaries = await this.partnerService.findPartnersByRole(tenantId, 'CUSTOMER', { search: filter?.search });
    this.metrics.trackClientRead();
    const clients: Client[] = [];

    for (const s of summaries) {
      const partner = await this.partnerRepository.findById(s.id);
      if (partner && !partner.deletedAt && this.clientMapper.matchesActiveFilter(partner, filter?.isActive)) {
        clients.push(this.clientMapper.toClient(partner));
      }
    }
    return clients.sort((a, b) => a.legalName.localeCompare(b.legalName));
  }

  async findClientById(id: string): Promise<Client | null> {
    const partnerId = await this.partnerService.resolvePartnerId('client', id);
    const partner = await this.partnerService.findPartnerById(partnerId);
    this.metrics.trackClientRead();
    if (!partner || partner.deletedAt) return null;
    return this.clientMapper.toClient(partner);
  }

  async updateClient(id: string, data: any): Promise<Client> {
    const partnerId = await this.partnerService.resolvePartnerId('client', id);
    const partner = await this.partnerService.findPartnerById(partnerId);
    if (!partner) throw new NotFoundException('Client not found');
    const actorId = data.updatedById ?? await this.getSystemUserId(partner.tenantId);
    await this.partnerService.updatePartner(partnerId, {
      legalName: data.legalName,
      updatedById: actorId,
    });
    this.metrics.trackClientWrite();
    const withRelations = await this.partnerRepository.findById(partnerId);
    return this.clientMapper.toClient(withRelations!);
  }

  async softDeleteClient(id: string, deletedById?: string): Promise<void> {
    const partnerId = await this.partnerService.resolvePartnerId('client', id);
    const partner = await this.partnerService.findPartnerById(partnerId);
    if (!partner) throw new NotFoundException('Client not found');
    const actorId = deletedById ?? await this.getSystemUserId(partner.tenantId);
    this.metrics.trackClientDelete();
    await this.partnerService.softDeletePartner(partnerId, actorId);
  }

  async createVendor(data: CreateVendorData): Promise<Vendor> {
    const actorId = data.createdById ?? await this.getSystemUserId(data.tenantId);
    const createData: CreatePartnerData = {
      tenantId: data.tenantId,
      type: this.vendorMapper.determineType(data),
      legalName: data.legalName,
      taxId: { value: data.taxId, country: 'VE', type: data.identificationType ?? '' },
      commercialName: data.commercialName ?? null,
      website: data.website ?? null,
      metadataSource: 'vendor',
      metadataNotes: data.metadataNotes ?? null,
      paymentTerms: data.paymentTerms ?? null,
      deliveryDays: data.deliveryDays ?? null,
      externalId: data.documentId,
      createdById: actorId,
      updatedById: actorId,
      roles: ['SUPPLIER'],
      categoryIds: data.categoryIds,
    };

    const partner = await this.partnerService.createPartner(createData);

    for (const contact of this.buildVendorContacts(data)) {
      await this.partnerRepository.addContact({
        partnerId: partner.id,
        fullName: contact.fullName,
        position: contact.position ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        mobile: contact.mobile ?? null,
        identificationType: contact.identificationType ?? null,
        identificationNumber: contact.identificationNumber ?? null,
        isPrimary: contact.isPrimary ?? false,
        createdById: actorId,
        updatedById: actorId,
      });
    }

    if (data.address?.addressLine?.trim()) {
      await this.partnerRepository.addAddress({
        partnerId: partner.id,
        type: 'FISCAL',
        line1: data.address.addressLine.trim(),
        line2: data.address.reference?.trim() || null,
        city: data.address.city,
        state: data.address.state,
        country: data.address.country,
        isPrimary: true,
        createdById: actorId,
        updatedById: actorId,
      });
    }

    this.metrics.trackVendorWrite();
    const withRelations = await this.partnerRepository.findById(partner.id);
    return this.vendorMapper.toVendor(withRelations!, data);
  }

  private buildVendorContacts(data: CreateVendorData): CreateVendorContactData[] {
    const contacts: CreateVendorContactData[] = [];
    const ownerName = [data.firstName, data.middleName, data.lastName, data.secondLastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (ownerName || data.email || data.phone || data.contactIdentificationNumber) {
      contacts.push({
        fullName: ownerName || data.legalName,
        position: 'Dueño',
        email: data.email || undefined,
        phone: data.phone || undefined,
        identificationType: data.contactIdentificationType ?? undefined,
        identificationNumber: data.contactIdentificationNumber ?? undefined,
        isPrimary: data.ownerIsPrimary ?? false,
      });
    }

    if (data.contacts?.length) {
      contacts.push(...data.contacts);
    } else if (!contacts.length && (data.contactFirstName || data.contactEmail || data.contactPhone)) {
      const contactName = [data.contactFirstName, data.contactMiddleName, data.contactLastName, data.contactSecondLastName]
        .filter(Boolean).join(' ') || data.legalName;
      contacts.push({
        fullName: contactName,
        email: data.contactEmail || undefined,
        phone: data.contactPhone || undefined,
        isPrimary: true,
      });
    }

    const ownerIndex = contacts.findIndex((c) => c.position === 'Dueño');
    if (data.ownerIsPrimary && ownerIndex >= 0) {
      return contacts.map((c, index) => ({ ...c, isPrimary: index === ownerIndex }));
    }
    if (contacts.length && !contacts.some((c) => c.isPrimary)) {
      const fallbackIndex = contacts.findIndex((c) => c.position !== 'Dueño');
      const index = fallbackIndex >= 0 ? fallbackIndex : 0;
      return contacts.map((c, i) => (i === index ? { ...c, isPrimary: true } : c));
    }

    return contacts;
  }

  async findAllVendors(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Vendor[]> {
    const summaries = await this.partnerService.findPartnersByRole(tenantId, 'SUPPLIER', { search: filter?.search });
    this.metrics.trackVendorRead();
    const vendors: Vendor[] = [];

    for (const s of summaries) {
      const partner = await this.partnerRepository.findById(s.id);
      if (partner && !partner.deletedAt && this.vendorMapper.matchesActiveFilter(partner, filter?.isActive)) {
        vendors.push(this.vendorMapper.toVendor(partner));
      }
    }
    return vendors.sort((a, b) => a.legalName.localeCompare(b.legalName));
  }

  async findVendorsByCategory(tenantId: string, categoryId: string): Promise<Vendor[]> {
    const result = await this.partnerRepository.findMany({
      tenantId,
      roles: ['SUPPLIER'],
      statuses: ['ACTIVE'],
      categoryIds: [categoryId],
      pageSize: 100,
    });
    this.metrics.trackVendorRead();
    const vendors: Vendor[] = [];
    for (const summary of result.data) {
      const partner = await this.partnerRepository.findById(summary.id);
      if (partner && !partner.deletedAt) {
        vendors.push(this.vendorMapper.toVendor(partner));
      }
    }
    return vendors.sort((a, b) => a.legalName.localeCompare(b.legalName));
  }

  async findVendorById(id: string): Promise<Vendor | null> {
    const partnerId = await this.partnerService.resolvePartnerId('vendor', id);
    const partner = await this.partnerService.findPartnerById(partnerId);
    this.metrics.trackVendorRead();
    if (!partner || partner.deletedAt) return null;
    return this.vendorMapper.toVendor(partner);
  }

  async updateVendor(id: string, data: UpdateVendorData): Promise<Vendor> {
    const partnerId = await this.partnerService.resolvePartnerId('vendor', id);
    const partner = await this.partnerService.findPartnerById(partnerId);
    if (!partner) throw new NotFoundException('Vendor not found');
    const actorId = data.updatedById ?? await this.getSystemUserId(partner.tenantId);

    const taxId = data.taxId !== undefined || data.identificationType !== undefined
      ? {
          value: data.taxId ?? partner.taxId?.value ?? '',
          country: partner.taxId?.country ?? 'VE',
          type: data.identificationType ?? partner.taxId?.type ?? '',
        }
      : undefined;

    await this.partnerService.updatePartner(partnerId, {
      legalName: data.legalName,
      commercialName: data.commercialName,
      website: data.website,
      paymentTerms: data.paymentTerms,
      deliveryDays: data.deliveryDays,
      metadataNotes: data.metadataNotes,
      categoryIds: data.categoryIds,
      taxId,
      externalId: data.documentId,
      updatedById: actorId,
    });

    if (data.contacts) {
      await this.syncVendorContacts(partnerId, partner.contacts ?? [], data.contacts, actorId);
    } else {
      const ownerName = [data.firstName, data.middleName, data.lastName, data.secondLastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (ownerName || data.email || data.phone || data.contactIdentificationNumber || data.ownerIsPrimary !== undefined) {
        const owner = partner.contacts?.find((c) => c.position === 'Dueño' && !c.deletedAt);
        if (owner) {
          await this.partnerRepository.updateContact(owner.id, {
            fullName: ownerName || undefined,
            email: data.email,
            phone: data.phone,
            identificationType: data.contactIdentificationType,
            identificationNumber: data.contactIdentificationNumber,
            isPrimary: data.ownerIsPrimary,
            updatedById: actorId,
          });
        } else {
          await this.partnerRepository.addContact({
            partnerId,
            fullName: ownerName || data.legalName || partner.legalName,
            position: 'Dueño',
            email: data.email ?? null,
            phone: data.phone ?? null,
            identificationType: data.contactIdentificationType ?? null,
            identificationNumber: data.contactIdentificationNumber ?? null,
            isPrimary: data.ownerIsPrimary ?? false,
            createdById: actorId,
            updatedById: actorId,
          });
        }
      }
    }

    if (data.address?.addressLine?.trim()) {
      const existing = partner.addresses?.find((a) => !a.deletedAt && a.type === 'FISCAL')
        ?? partner.addresses?.find((a) => !a.deletedAt);
      const addressData = {
        type: 'FISCAL' as const,
        line1: data.address.addressLine.trim(),
        line2: data.address.reference?.trim() || null,
        city: data.address.city,
        state: data.address.state,
        country: data.address.country,
        isPrimary: true,
      };
      if (existing) {
        await this.partnerRepository.updateAddress(existing.id, { ...addressData, updatedById: actorId });
      } else {
        await this.partnerRepository.addAddress({
          ...addressData,
          partnerId,
          createdById: actorId,
          updatedById: actorId,
        });
      }
    }

    this.metrics.trackVendorWrite();
    const withRelations = await this.partnerRepository.findById(partnerId);
    return this.vendorMapper.toVendor(withRelations!);
  }

  private async syncVendorContacts(
    partnerId: string,
    existing: Array<{ id: string }>,
    contacts: UpdateVendorContactData[],
    actorId: string,
  ): Promise<void> {
    const incomingIds = new Set(contacts.map((c) => c.id).filter((id): id is string => Boolean(id)));

    for (const contact of existing) {
      if (!incomingIds.has(contact.id)) {
        await this.partnerRepository.softDeleteContact(contact.id);
      }
    }

    await this.prisma.contact.updateMany({
      where: { partnerId, deletedAt: null },
      data: { isPrimary: false },
    });

    for (const contact of contacts) {
      const payload = {
        fullName: contact.fullName,
        position: contact.position ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        mobile: contact.mobile ?? null,
        identificationType: contact.identificationType ?? null,
        identificationNumber: contact.identificationNumber ?? null,
        isPrimary: contact.isPrimary ?? false,
        updatedById: actorId,
      };
      if (contact.id && existing.some((c) => c.id === contact.id)) {
        await this.partnerRepository.updateContact(contact.id, payload);
      } else {
        await this.partnerRepository.addContact({ ...payload, partnerId, createdById: actorId });
      }
    }
  }

  async softDeleteVendor(id: string, deletedById?: string): Promise<void> {
    const partnerId = await this.partnerService.resolvePartnerId('vendor', id);
    const partner = await this.partnerService.findPartnerById(partnerId);
    if (!partner) throw new NotFoundException('Vendor not found');
    const actorId = deletedById ?? await this.getSystemUserId(partner.tenantId);
    this.metrics.trackVendorDelete();
    await this.partnerService.softDeletePartner(partnerId, actorId);
  }

  private async getSystemUserId(tenantId: string): Promise<string> {
    const admin = await this.prisma.user.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        roles: { some: { role: { name: { in: ['super-admin', 'Admin', 'admin'] } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (admin) return admin.id;

    const fallback = await this.prisma.user.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (fallback) return fallback.id;

    throw new UnprocessableEntityException(`No user available to attribute the operation in tenant ${tenantId}`);
  }
}

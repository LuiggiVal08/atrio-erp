import { Injectable, Inject, NotFoundException, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PartnerService } from '@/core/business-partners/application/partner.service';
import { PARTNER_REPOSITORY } from '@/core/business-partners/domain/partner.repository.interface';
import type { PartnerRepository, CreatePartnerData } from '@/core/business-partners/domain/partner.repository.interface';
import type { ClientVendorRepository, CreateClientData, CreateVendorData, CreateVendorContactData, UpdateVendorData, UpdateClientData, UpdateVendorContactData, PartnerListFilter } from '../domain/client-vendor.repository.interface';
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
      clientIdentity: {
        firstName: data.firstName ?? null, middleName: data.middleName ?? null,
        lastName: data.lastName ?? null, secondLastName: data.secondLastName ?? null,
        contributorType: data.contributorType ?? null,
      },
      contacts: [{
        fullName: [data.firstName, data.middleName, data.lastName, data.secondLastName].filter(Boolean).join(' ') || data.legalName,
        email: data.email ?? null, phone: data.phone ?? null, isPrimary: true,
        createdById: actorId, updatedById: actorId,
      }],
      addresses: data.address?.addressLine.trim() ? [{
        type: 'FISCAL', line1: data.address.addressLine.trim(), line2: data.address.reference?.trim() || null,
        city: data.address.city, state: data.address.state, country: data.address.country,
        isPrimary: true, createdById: actorId, updatedById: actorId,
      }] : undefined,
    };

    const partner = await this.partnerService.createPartner(createData);
    this.metrics.trackClientWrite();
    const withRelations = await this.partnerRepository.findById(partner.id);
    return this.clientMapper.toClient(withRelations!);
  }

  async findClientsPage(tenantId: string, filter: PartnerListFilter) {
    const result = await this.partnerRepository.findMany({ tenantId, roles: ['CUSTOMER'], ...filter });
    const partners = await Promise.all(result.data.map((s) => this.partnerRepository.findById(s.id)));
    this.metrics.trackClientRead();
    return { ...result, data: partners.filter((p) => p && p.tenantId === tenantId && !p.deletedAt).map((p) => this.clientMapper.toClient(p!)) };
  }

  async findVendorsPage(tenantId: string, filter: PartnerListFilter) {
    const result = await this.partnerRepository.findMany({ tenantId, roles: ['SUPPLIER'], ...filter });
    const partners = await Promise.all(result.data.map((s) => this.partnerRepository.findById(s.id)));
    this.metrics.trackVendorRead();
    return { ...result, data: partners.filter((p) => p && p.tenantId === tenantId && !p.deletedAt).map((p) => this.vendorMapper.toVendor(p!)) };
  }

  private async findRoleReferences(tenantId: string, role: 'CUSTOMER' | 'SUPPLIER', search?: string) {
    const summaries = [];
    for (let page = 1; ; page++) {
      const result = await this.partnerService.findPartnersByRole(tenantId, role, { search, page, pageSize: 100 });
      summaries.push(...result.data);
      if (!result.data.length || summaries.length >= result.total) break;
    }
    return summaries;
  }

  async findAllClients(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Client[]> {
    const summaries = await this.findRoleReferences(tenantId, 'CUSTOMER', filter?.search);
    this.metrics.trackClientRead();
    const clients: Client[] = [];

    for (const s of summaries) {
      const partner = await this.partnerRepository.findById(s.id);
      if (partner && partner.tenantId === tenantId && !partner.deletedAt && this.clientMapper.matchesActiveFilter(partner, filter?.isActive)) {
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

  async updateClient(id: string, data: UpdateClientData): Promise<Client> {
    const partnerId = await this.partnerService.resolvePartnerId('client', id);
    const result = await this.partnerRepository.withTransaction(async (repo) => {
      const partner = await repo.findById(partnerId);
      if (!partner || partner.deletedAt || (data.tenantId !== undefined && partner.tenantId !== data.tenantId)) throw new NotFoundException('Client not found');
      const actorId = data.updatedById ?? await this.getSystemUserId(partner.tenantId);
      await repo.update(partnerId, {
        legalName: data.legalName, externalId: data.documentId,
        taxId: data.taxId !== undefined || data.identificationType !== undefined ? {
          value: data.taxId ?? partner.taxId?.value ?? '', country: partner.taxId?.country ?? 'VE', type: data.identificationType ?? partner.taxId?.type ?? '',
        } : undefined,
        updatedById: actorId,
      });
      const nameFields = ['firstName', 'middleName', 'lastName', 'secondLastName'] as const;
      const identity = { ...partner.clientIdentity };
      for (const field of [...nameFields, 'contributorType'] as const) if (data[field] !== undefined) identity[field] = data[field] ?? null;
      const namesChanged = nameFields.some((field) => data[field] !== undefined);
      if (namesChanged || data.contributorType !== undefined) await repo.addEvent(partnerId, 'compatibility.client.identity', identity, actorId);
      if (data.email !== undefined || data.phone !== undefined || namesChanged) {
        const contact = partner.contacts?.find((c) => c.isPrimary) ?? partner.contacts?.[0];
        const fullName = namesChanged ? nameFields.map((field) => identity[field]).filter(Boolean).join(' ') || data.legalName || partner.legalName : undefined;
        if (contact) await repo.updateContact(contact.id, { fullName, email: data.email, phone: data.phone, updatedById: actorId });
        else await repo.addContact({ partnerId, fullName: fullName || data.legalName || partner.legalName, email: data.email, phone: data.phone, isPrimary: true, createdById: actorId, updatedById: actorId });
      }
      if (data.address !== undefined) {
        const existing = partner.addresses.find((a) => a.type === 'FISCAL' && !a.deletedAt);
        if (data.address === null) { if (existing) await repo.softDeleteAddress(existing.id); }
        else {
          const address = data.address;
          if (!address.addressLine.trim()) throw new BadRequestException('Address line is required');
          const fields = { type: 'FISCAL' as const, line1: address.addressLine.trim(), line2: address.reference?.trim() || null, city: address.city, state: address.state, country: address.country, isPrimary: true, updatedById: actorId };
          if (existing) await repo.updateAddress(existing.id, fields);
          else await repo.addAddress({ ...fields, partnerId, createdById: actorId });
        }
      }
      return this.clientMapper.toClient((await repo.findById(partnerId))!);
    });
    this.metrics.trackClientWrite();
    return result;
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
      contacts: this.buildVendorContacts(data).map((contact) => ({ ...contact, createdById: actorId, updatedById: actorId })),
      addresses: data.address?.addressLine.trim() ? [{
        type: 'FISCAL', line1: data.address.addressLine.trim(), line2: data.address.reference?.trim() || null,
        city: data.address.city, state: data.address.state, country: data.address.country,
        isPrimary: true, createdById: actorId, updatedById: actorId,
      }] : undefined,
    };

    const partner = await this.partnerService.createPartner(createData);

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
    const summaries = await this.findRoleReferences(tenantId, 'SUPPLIER', filter?.search);
    this.metrics.trackVendorRead();
    const vendors: Vendor[] = [];

    for (const s of summaries) {
      const partner = await this.partnerRepository.findById(s.id);
      if (partner && partner.tenantId === tenantId && !partner.deletedAt && this.vendorMapper.matchesActiveFilter(partner, filter?.isActive)) {
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
      if (partner && partner.tenantId === tenantId && !partner.deletedAt) {
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
    return this.partnerRepository.withTransaction((repo) =>
      new PartnerCompatibilityAdapter(this.prisma, new PartnerService(this.prisma, repo), repo, this.clientMapper, this.vendorMapper, this.metrics)
        .updateVendorInTransaction(partnerId, data));
  }

  private async updateVendorInTransaction(partnerId: string, data: UpdateVendorData): Promise<Vendor> {
    const partner = await this.partnerRepository.findById(partnerId);
    if (!partner || partner.deletedAt || (data.tenantId !== undefined && partner.tenantId !== data.tenantId)) throw new NotFoundException('Vendor not found');
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

    if (data.contacts !== undefined) {
      const desired = data.contacts.map((c) => ({ ...c }));
      const general = partner.contacts?.find((c) => c.position === 'Dueño' && !c.deletedAt)
        ?? partner.contacts?.find((c) => c.isPrimary && !c.deletedAt) ?? partner.contacts?.[0];
      const target = desired.find((c) => c.id === general?.id);
      if (target) {
        if (data.email !== undefined) target.email = data.email;
        if (data.phone !== undefined) target.phone = data.phone;
      } else if (data.email || data.phone) {
        if (general) throw new BadRequestException('General contact is not in the desired contact set');
        desired.push({ fullName: data.legalName || partner.legalName, position: 'Dueño', email: data.email, phone: data.phone, isPrimary: !desired.length });
      }
      await this.syncVendorContacts(partnerId, partner.contacts ?? [], desired, actorId);
    } else {
      const ownerName = [data.firstName, data.middleName, data.lastName, data.secondLastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (ownerName || data.email !== undefined || data.phone !== undefined || data.contactIdentificationNumber !== undefined || data.ownerIsPrimary !== undefined) {
        const owner = partner.contacts?.find((c) => c.position === 'Dueño' && !c.deletedAt)
          ?? partner.contacts?.find((c) => c.isPrimary && !c.deletedAt) ?? partner.contacts?.[0];
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
          if (data.ownerIsPrimary) {
            for (const contact of partner.contacts ?? []) {
              if (contact.id !== owner.id) await this.partnerRepository.updateContact(contact.id, { isPrimary: false, updatedById: actorId });
            }
          }
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

    if (data.address === null) {
      const fiscal = partner.addresses?.find((a) => !a.deletedAt && a.type === 'FISCAL');
      if (fiscal) await this.partnerRepository.softDeleteAddress(fiscal.id);
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
    existing: Array<{ id: string; isPrimary?: boolean }>, 
    contacts: UpdateVendorContactData[],
    actorId: string,
  ): Promise<void> {
    const ids = contacts.flatMap((c) => c.id ? [c.id] : []);
    if (new Set(ids).size !== ids.length || ids.some((id) => !existing.some((c) => c.id === id))) throw new BadRequestException('Invalid contact id');
    if (contacts.some((c) => !c.fullName?.trim())) throw new BadRequestException('Contact name is required');
    if (contacts.filter((c) => c.isPrimary === true).length > 1) throw new BadRequestException('Only one primary contact is allowed');
    const incomingIds = new Set(ids);
    const explicitPrimary = contacts.findIndex((c) => c.isPrimary === true);
    const preservedPrimary = contacts.findIndex((c) => c.isPrimary === undefined && existing.some((e) => e.id === c.id && e.isPrimary));
    const primaryIndex = explicitPrimary >= 0 ? explicitPrimary : preservedPrimary >= 0 ? preservedPrimary : 0;
    for (const contact of existing) {
      if (!incomingIds.has(contact.id)) await this.partnerRepository.softDeleteContact(contact.id);
    }

    for (const [index, contact] of contacts.entries()) {
      const payload = {
        fullName: contact.fullName.trim(),
        position: contact.position,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        identificationType: contact.identificationType,
        identificationNumber: contact.identificationNumber,
        isPrimary: index === primaryIndex,
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

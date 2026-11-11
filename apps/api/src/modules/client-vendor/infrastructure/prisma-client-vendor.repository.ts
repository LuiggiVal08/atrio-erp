import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ClientVendorRepository, CreateClientData, CreateVendorData } from '../domain/client-vendor.repository.interface';
import { Client } from '../domain/client.entity';
import { Vendor } from '../domain/vendor.entity';

@Injectable()
export class PrismaClientVendorRepository implements ClientVendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createClient(data: CreateClientData): Promise<Client> {
    const r = await this.prisma.client.create({
      data: {
        tenantId: data.tenantId,
        documentId: data.documentId,
        identificationType: data.identificationType as any ?? null,
        legalName: data.legalName,
        firstName: data.firstName ?? null,
        middleName: data.middleName ?? null,
        lastName: data.lastName ?? null,
        secondLastName: data.secondLastName ?? null,
        taxId: data.taxId,
        email: data.email ?? null,
        phone: data.phone ?? null,
        addressId: data.addressId ?? null,
        contributorType: data.contributorType ?? null,
      },
    });
    return new Client(r.id, r.tenantId, r.documentId, r.identificationType, r.legalName, r.firstName, r.middleName, r.lastName, r.secondLastName, r.taxId, r.email, r.phone, r.addressId, r.contributorType, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async findAllClients(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Client[]> {
    const where: any = { tenantId, deletedAt: null };
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.search) {
      where.OR = [
        { legalName: { contains: filter.search, mode: 'insensitive' } },
        { taxId: { contains: filter.search, mode: 'insensitive' } },
        { documentId: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    const records = await this.prisma.client.findMany({ where, orderBy: { legalName: 'asc' } });
    return records.map(r => new Client(r.id, r.tenantId, r.documentId, r.identificationType, r.legalName, r.firstName, r.middleName, r.lastName, r.secondLastName, r.taxId, r.email, r.phone, r.addressId, r.contributorType, r.isActive, r.createdAt, r.updatedAt, r.deletedAt));
  }

  async findClientById(id: string): Promise<Client | null> {
    const r = await this.prisma.client.findFirst({ where: { id, deletedAt: null } });
    if (!r) return null;
    return new Client(r.id, r.tenantId, r.documentId, r.identificationType, r.legalName, r.firstName, r.middleName, r.lastName, r.secondLastName, r.taxId, r.email, r.phone, r.addressId, r.contributorType, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async updateClient(id: string, data: any): Promise<Client> {
    const r = await this.prisma.client.update({ where: { id }, data });
    return new Client(r.id, r.tenantId, r.documentId, r.identificationType, r.legalName, r.firstName, r.middleName, r.lastName, r.secondLastName, r.taxId, r.email, r.phone, r.addressId, r.contributorType, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async softDeleteClient(id: string): Promise<void> {
    await this.prisma.client.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  async createVendor(data: CreateVendorData): Promise<Vendor> {
    const r = await this.prisma.vendor.create({
      data: {
        tenantId: data.tenantId,
        documentId: data.documentId,
        identificationType: data.identificationType as any ?? null,
        legalName: data.legalName,
        firstName: data.firstName ?? null,
        middleName: data.middleName ?? null,
        lastName: data.lastName ?? null,
        secondLastName: data.secondLastName ?? null,
        taxId: data.taxId,
        email: data.email ?? null,
        phone: data.phone ?? null,
        addressId: data.addressId ?? null,
        contactFirstName: data.contactFirstName ?? null,
        contactMiddleName: data.contactMiddleName ?? null,
        contactLastName: data.contactLastName ?? null,
        contactSecondLastName: data.contactSecondLastName ?? null,
        contactIdentificationType: data.contactIdentificationType as any ?? null,
        contactIdentificationNumber: data.contactIdentificationNumber ?? null,
        contactEmail: data.contactEmail ?? null,
        contactPhone: data.contactPhone ?? null,
      },
    });
    return new Vendor(r.id, r.tenantId, r.documentId, r.identificationType, r.legalName, r.firstName, r.middleName, r.lastName, r.secondLastName, r.taxId, r.email, r.phone, r.addressId, r.contactFirstName, r.contactMiddleName, r.contactLastName, r.contactSecondLastName, r.contactIdentificationType, r.contactIdentificationNumber, r.contactEmail, r.contactPhone, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async findAllVendors(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Vendor[]> {
    const where: any = { tenantId, deletedAt: null };
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.search) {
      where.OR = [
        { legalName: { contains: filter.search, mode: 'insensitive' } },
        { taxId: { contains: filter.search, mode: 'insensitive' } },
        { documentId: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    const records = await this.prisma.vendor.findMany({ where, orderBy: { legalName: 'asc' } });
    return records.map(r => new Vendor(r.id, r.tenantId, r.documentId, r.identificationType, r.legalName, r.firstName, r.middleName, r.lastName, r.secondLastName, r.taxId, r.email, r.phone, r.addressId, r.contactFirstName, r.contactMiddleName, r.contactLastName, r.contactSecondLastName, r.contactIdentificationType, r.contactIdentificationNumber, r.contactEmail, r.contactPhone, r.isActive, r.createdAt, r.updatedAt, r.deletedAt));
  }

  async findVendorsByCategory(_tenantId: string, _categoryId: string): Promise<Vendor[]> {
    return [];
  }

  async findVendorById(id: string): Promise<Vendor | null> {
    const r = await this.prisma.vendor.findFirst({ where: { id, deletedAt: null } });
    if (!r) return null;
    return new Vendor(r.id, r.tenantId, r.documentId, r.identificationType, r.legalName, r.firstName, r.middleName, r.lastName, r.secondLastName, r.taxId, r.email, r.phone, r.addressId, r.contactFirstName, r.contactMiddleName, r.contactLastName, r.contactSecondLastName, r.contactIdentificationType, r.contactIdentificationNumber, r.contactEmail, r.contactPhone, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async updateVendor(id: string, data: any): Promise<Vendor> {
    const r = await this.prisma.vendor.update({ where: { id }, data });
    return new Vendor(r.id, r.tenantId, r.documentId, r.identificationType, r.legalName, r.firstName, r.middleName, r.lastName, r.secondLastName, r.taxId, r.email, r.phone, r.addressId, r.contactFirstName, r.contactMiddleName, r.contactLastName, r.contactSecondLastName, r.contactIdentificationType, r.contactIdentificationNumber, r.contactEmail, r.contactPhone, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async softDeleteVendor(id: string): Promise<void> {
    await this.prisma.vendor.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

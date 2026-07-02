import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ClientVendorRepository } from '../domain/client-vendor.repository.interface';
import { Client } from '../domain/client.entity';
import { Vendor } from '../domain/vendor.entity';

@Injectable()
export class PrismaClientVendorRepository implements ClientVendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createClient(data: { tenantId: string; legalName: string; taxId: string; email?: string; phone?: string; address?: string }): Promise<Client> {
    const r = await this.prisma.client.create({ data: { tenantId: data.tenantId, documentId: data.taxId, legalName: data.legalName, taxId: data.taxId, email: data.email ?? null, phone: data.phone ?? null, address: data.address ?? null } });
    return new Client(r.id, r.tenantId, r.legalName, r.taxId, r.email, r.phone, r.address, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async findAllClients(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Client[]> {
    const where: any = { tenantId, deletedAt: null };
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.search) {
      where.OR = [
        { legalName: { contains: filter.search, mode: 'insensitive' } },
        { taxId: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    const records = await this.prisma.client.findMany({ where, orderBy: { legalName: 'asc' } });
    return records.map(r => new Client(r.id, r.tenantId, r.legalName, r.taxId, r.email, r.phone, r.address, r.isActive, r.createdAt, r.updatedAt, r.deletedAt));
  }

  async findClientById(id: string): Promise<Client | null> {
    const r = await this.prisma.client.findFirst({ where: { id, deletedAt: null } });
    if (!r) return null;
    return new Client(r.id, r.tenantId, r.legalName, r.taxId, r.email, r.phone, r.address, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async updateClient(id: string, data: any): Promise<Client> {
    const r = await this.prisma.client.update({ where: { id }, data });
    return new Client(r.id, r.tenantId, r.legalName, r.taxId, r.email, r.phone, r.address, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async softDeleteClient(id: string): Promise<void> {
    await this.prisma.client.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  async createVendor(data: { tenantId: string; legalName: string; taxId: string; email?: string; phone?: string; address?: string }): Promise<Vendor> {
    const r = await this.prisma.vendor.create({ data: { tenantId: data.tenantId, documentId: data.taxId, legalName: data.legalName, taxId: data.taxId, email: data.email ?? null, phone: data.phone ?? null, address: data.address ?? null } });
    return new Vendor(r.id, r.tenantId, r.legalName, r.taxId, r.email, r.phone, r.address, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async findAllVendors(tenantId: string, filter?: { isActive?: boolean; search?: string }): Promise<Vendor[]> {
    const where: any = { tenantId, deletedAt: null };
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.search) {
      where.OR = [
        { legalName: { contains: filter.search, mode: 'insensitive' } },
        { taxId: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    const records = await this.prisma.vendor.findMany({ where, orderBy: { legalName: 'asc' } });
    return records.map(r => new Vendor(r.id, r.tenantId, r.legalName, r.taxId, r.email, r.phone, r.address, r.isActive, r.createdAt, r.updatedAt, r.deletedAt));
  }

  async findVendorById(id: string): Promise<Vendor | null> {
    const r = await this.prisma.vendor.findFirst({ where: { id, deletedAt: null } });
    if (!r) return null;
    return new Vendor(r.id, r.tenantId, r.legalName, r.taxId, r.email, r.phone, r.address, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async updateVendor(id: string, data: any): Promise<Vendor> {
    const r = await this.prisma.vendor.update({ where: { id }, data });
    return new Vendor(r.id, r.tenantId, r.legalName, r.taxId, r.email, r.phone, r.address, r.isActive, r.createdAt, r.updatedAt, r.deletedAt);
  }

  async softDeleteVendor(id: string): Promise<void> {
    await this.prisma.vendor.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

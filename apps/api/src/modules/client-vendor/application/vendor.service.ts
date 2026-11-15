import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ClientVendorRepository, CreateVendorData, UpdateVendorData } from '../domain/client-vendor.repository.interface';

@Injectable()
export class VendorService {
  constructor(@Inject('ClientVendorRepository') private readonly repo: ClientVendorRepository) {}

  async create(data: CreateVendorData) {
    try {
      return await this.repo.createVendor(data);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Document ID already exists');
      throw error;
    }
  }

  async findAll(tenantId: string, filter?: { isActive?: boolean; search?: string }) {
    return this.repo.findAllVendors(tenantId, filter);
  }

  async findByCategory(tenantId: string, categoryId: string) {
    return this.repo.findVendorsByCategory(tenantId, categoryId);
  }

  async findPage(tenantId: string, filter: import('../domain/client-vendor.repository.interface').PartnerListFilter) {
    if (!this.repo.findVendorsPage) throw new Error('Partner pagination is unavailable');
    return this.repo.findVendorsPage(tenantId, filter);
  }

  async findById(id: string, tenantId?: string) {
    const vendor = await this.repo.findVendorById(id);
    if (!vendor || (tenantId !== undefined && vendor.tenantId !== tenantId)) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, data: UpdateVendorData) {
    const existing = await this.repo.findVendorById(id);
    if (!existing || (data.tenantId !== undefined && existing.tenantId !== data.tenantId)) throw new NotFoundException('Vendor not found');
    return this.repo.updateVendor(id, data);
  }

  async softDelete(id: string, deletedById?: string, tenantId?: string) {
    const existing = await this.repo.findVendorById(id);
    if (!existing || (tenantId !== undefined && existing.tenantId !== tenantId)) throw new NotFoundException('Vendor not found');
    return this.repo.softDeleteVendor(id, deletedById);
  }
}

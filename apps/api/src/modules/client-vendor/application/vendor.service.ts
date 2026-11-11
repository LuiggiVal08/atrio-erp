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

  async findById(id: string) {
    const vendor = await this.repo.findVendorById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, data: UpdateVendorData) {
    const existing = await this.repo.findVendorById(id);
    if (!existing) throw new NotFoundException('Vendor not found');
    return this.repo.updateVendor(id, data);
  }

  async softDelete(id: string, deletedById?: string) {
    const existing = await this.repo.findVendorById(id);
    if (!existing) throw new NotFoundException('Vendor not found');
    return this.repo.softDeleteVendor(id, deletedById);
  }
}

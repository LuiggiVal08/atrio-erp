import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ClientVendorRepository } from '../domain/client-vendor.repository.interface';

@Injectable()
export class VendorService {
  constructor(@Inject('ClientVendorRepository') private readonly repo: ClientVendorRepository) {}

  async create(data: {
    tenantId: string; legalName: string; taxId: string;
    email?: string; phone?: string; address?: string;
  }) {
    try {
      return await this.repo.createVendor(data);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Tax ID already exists');
      throw error;
    }
  }

  async findAll(tenantId: string, filter?: { isActive?: boolean; search?: string }) {
    return this.repo.findAllVendors(tenantId, filter);
  }

  async findById(id: string) {
    const vendor = await this.repo.findVendorById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, data: any) {
    const existing = await this.repo.findVendorById(id);
    if (!existing) throw new NotFoundException('Vendor not found');
    return this.repo.updateVendor(id, data);
  }

  async softDelete(id: string) {
    const existing = await this.repo.findVendorById(id);
    if (!existing) throw new NotFoundException('Vendor not found');
    return this.repo.softDeleteVendor(id);
  }
}

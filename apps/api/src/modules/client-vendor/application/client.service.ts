import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ClientVendorRepository } from '../domain/client-vendor.repository.interface';

@Injectable()
export class ClientService {
  constructor(@Inject('ClientVendorRepository') private readonly repo: ClientVendorRepository) {}

  async create(data: {
    tenantId: string; legalName: string; taxId: string;
    email?: string; phone?: string; address?: string;
  }) {
    try {
      return await this.repo.createClient(data);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Tax ID already exists');
      throw error;
    }
  }

  async findAll(tenantId: string, filter?: { isActive?: boolean; search?: string }) {
    return this.repo.findAllClients(tenantId, filter);
  }

  async findById(id: string) {
    const client = await this.repo.findClientById(id);
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, data: any) {
    const existing = await this.repo.findClientById(id);
    if (!existing) throw new NotFoundException('Client not found');
    return this.repo.updateClient(id, data);
  }

  async softDelete(id: string) {
    const existing = await this.repo.findClientById(id);
    if (!existing) throw new NotFoundException('Client not found');
    return this.repo.softDeleteClient(id);
  }
}

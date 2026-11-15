import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ClientVendorRepository, CreateClientData, UpdateClientData } from '../domain/client-vendor.repository.interface';

@Injectable()
export class ClientService {
  constructor(@Inject('ClientVendorRepository') private readonly repo: ClientVendorRepository) {}

  async create(data: CreateClientData) {
    try {
      return await this.repo.createClient(data);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Document ID already exists');
      throw error;
    }
  }

  async findAll(tenantId: string, filter?: { isActive?: boolean; search?: string }) {
    return this.repo.findAllClients(tenantId, filter);
  }

  async findPage(tenantId: string, filter: import('../domain/client-vendor.repository.interface').PartnerListFilter) {
    if (!this.repo.findClientsPage) throw new Error('Partner pagination is unavailable');
    return this.repo.findClientsPage(tenantId, filter);
  }

  async findById(id: string, tenantId?: string) {
    const client = await this.repo.findClientById(id);
    if (!client || (tenantId !== undefined && client.tenantId !== tenantId)) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, data: UpdateClientData) {
    const existing = await this.repo.findClientById(id);
    if (!existing || (data.tenantId !== undefined && existing.tenantId !== data.tenantId)) throw new NotFoundException('Client not found');
    return this.repo.updateClient(id, data);
  }

  async softDelete(id: string, deletedById?: string, tenantId?: string) {
    const existing = await this.repo.findClientById(id);
    if (!existing || (tenantId !== undefined && existing.tenantId !== tenantId)) throw new NotFoundException('Client not found');
    return this.repo.softDeleteClient(id, deletedById);
  }
}

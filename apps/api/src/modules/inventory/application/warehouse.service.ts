import { Injectable, Inject } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class WarehouseService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: { tenantId: string; name: string; code?: string; branchId?: string; aisle?: string; shelf?: string; level?: string; bin?: string }) {
    return this.repo.createWarehouse(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findAllWarehouses(tenantId);
  }

  async update(id: string, data: { name?: string; code?: string | null; branchId?: string | null; isActive?: boolean; aisle?: string | null; shelf?: string | null; level?: string | null; bin?: string | null }) {
    return this.repo.updateWarehouse(id, data);
  }

  async softDelete(id: string) {
    return this.repo.softDeleteWarehouse(id);
  }
}

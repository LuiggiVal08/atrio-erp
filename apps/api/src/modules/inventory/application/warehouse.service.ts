import { Injectable, Inject } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class WarehouseService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: { tenantId: string; name: string }) {
    return this.repo.createWarehouse(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findAllWarehouses(tenantId);
  }

  async softDelete(id: string) {
    return this.repo.softDeleteWarehouse(id);
  }
}

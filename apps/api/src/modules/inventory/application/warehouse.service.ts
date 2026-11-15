import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InventoryRepository, WarehouseSummary } from '../domain/inventory.repository.interface';
import { Warehouse } from '../domain/warehouse.entity';

@Injectable()
export class WarehouseService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: { tenantId: string; name: string; code?: string; branchId?: string }) {
    await this.assertBranch(data.tenantId, data.branchId);
    return this.repo.createWarehouse(data);
  }

  async findAll(tenantId: string, includeInactive = false) {
    return this.repo.findAllWarehouses(tenantId, includeInactive);
  }

  async findById(tenantId: string, id: string): Promise<Warehouse> {
    const warehouse = await this.repo.findWarehouseById(id);
    if (!warehouse || warehouse.tenantId !== tenantId) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  async update(
    tenantId: string,
    id: string,
    data: { name?: string; code?: string | null; branchId?: string | null; isActive?: boolean },
  ) {
    const warehouse = await this.findById(tenantId, id);
    if (data.isActive === false) await this.assertCanDeactivate(tenantId, id);
    if (data.branchId !== undefined || data.isActive === true) await this.assertBranch(tenantId, data.branchId !== undefined ? data.branchId : warehouse.branchId);
    return this.repo.updateWarehouse(id, data);
  }

  async softDelete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.assertCanDeactivate(tenantId, id);
    return this.repo.softDeleteWarehouse(id);
  }

  async setDefault(tenantId: string, id: string) {
    const warehouse = await this.findById(tenantId, id);
    if (!warehouse.isActive) {
      throw new BadRequestException('No se puede marcar como predeterminado un almacén inactivo');
    }
    await this.assertBranch(tenantId, warehouse.branchId);
    await this.repo.setDefaultWarehouse(tenantId, id);
    return warehouse;
  }

  async getDefault(tenantId: string) {
    return this.repo.getDefaultWarehouse(tenantId);
  }

  private async assertBranch(tenantId: string, branchId?: string | null) {
    if (!tenantId) throw new BadRequestException('Tenant context is required');
    if (!branchId) return;
    const branch = await this.repo.findBranchById(branchId);
    if (!branch || branch.tenantId !== tenantId || !branch.isActive) throw new BadRequestException('Branch must be active and belong to tenant');
  }

  private async assertCanDeactivate(tenantId: string, id: string) {
    const current = await this.repo.getDefaultWarehouse(tenantId);
    if (current?.id === id) throw new BadRequestException('Choose another default warehouse before deactivating this one');
  }

  async getSummary(tenantId: string, id: string): Promise<WarehouseSummary> {
    await this.findById(tenantId, id);
    return this.repo.getWarehouseSummary(tenantId, id);
  }
}

import { BadRequestException, ConflictException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';
import { Branch } from '../domain/branch.entity';

export interface CreateBranchData {
  tenantId: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  managerEmployeeId?: string;
}

export interface UpdateBranchData {
  name?: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  managerEmployeeId?: string | null;
  isActive?: boolean;
}

@Injectable()
export class BranchService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: CreateBranchData) {
    if (data.managerEmployeeId) {
      await this.assertManagerBelongsToTenant(data.tenantId, data.managerEmployeeId);
    }
    try {
      return await this.repo.createBranch(data);
    } catch (error) {
      this.rethrowDuplicateCode(error);
      throw error;
    }
  }

  async findAll(tenantId: string, includeInactive = false) {
    return this.repo.findAllBranches(tenantId, includeInactive);
  }

  async findById(tenantId: string, id: string): Promise<Branch> {
    const branch = await this.repo.findBranchById(id);
    if (!branch || branch.tenantId !== tenantId) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async update(tenantId: string, id: string, data: UpdateBranchData) {
    await this.findById(tenantId, id);

    if (data.managerEmployeeId) {
      await this.assertManagerBelongsToTenant(tenantId, data.managerEmployeeId);
    }

    if (data.isActive === false) {
      await this.assertCanDeactivate(id);
    }

    try {
      return await this.repo.updateBranch(id, data);
    } catch (error) {
      this.rethrowDuplicateCode(error);
      throw error;
    }
  }

  async softDelete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.assertCanDeactivate(id);
    return this.repo.softDeleteBranch(id);
  }

  private async assertManagerBelongsToTenant(tenantId: string, employeeId: string) {
    const exists = await this.repo.employeeBelongsToTenant(tenantId, employeeId);
    if (!exists) {
      throw new BadRequestException({
        message: 'El encargado no existe o no pertenece a la empresa',
        errors: [
          {
            field: 'managerEmployeeId',
            message: 'El encargado no existe o no pertenece a la empresa',
          },
        ],
      });
    }
  }

  private async assertCanDeactivate(branchId: string) {
    const activeWarehouses = await this.repo.countActiveWarehousesByBranch(branchId);
    if (activeWarehouses > 0) {
      throw new BadRequestException(
        'No se puede desactivar una sucursal con almacenes activos',
      );
    }
  }

  private rethrowDuplicateCode(error: unknown): void {
    if ((error as { code?: string })?.code === 'P2002') {
      throw new ConflictException({
        message: 'Ya existe una sucursal con ese código',
        errors: [
          { field: 'code', message: 'Ya existe una sucursal con ese código' },
        ],
      });
    }
  }
}

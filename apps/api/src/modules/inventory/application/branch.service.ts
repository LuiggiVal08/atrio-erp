import { Injectable, Inject } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class BranchService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: { tenantId: string; name: string; code?: string; address?: string; phone?: string }) {
    return this.repo.createBranch(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findAllBranches(tenantId);
  }

  async update(id: string, data: { name?: string; code?: string | null; address?: string | null; phone?: string | null; isActive?: boolean }) {
    return this.repo.updateBranch(id, data);
  }

  async softDelete(id: string) {
    return this.repo.softDeleteBranch(id);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class ProductCategoryService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: { tenantId: string; name: string; parentId?: string }) {
    return this.repo.createCategory(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findAllCategories(tenantId);
  }

  async update(id: string, data: { name?: string; parentId?: string }) {
    return this.repo.updateCategory(id, data);
  }

  async delete(id: string) {
    return this.repo.deleteCategory(id);
  }
}

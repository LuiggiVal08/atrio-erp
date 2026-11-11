import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
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
    const productCount = await this.repo.countProductsByCategory(id);
    if (productCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la categoría: ${productCount} producto(s) están asociados`,
      );
    }

    const childCount = await this.repo.countChildCategories(id);
    if (childCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la categoría: tiene ${childCount} subcategoría(s)`,
      );
    }

    return this.repo.deleteCategory(id);
  }
}

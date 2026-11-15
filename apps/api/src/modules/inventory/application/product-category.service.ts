import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class ProductCategoryService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: { tenantId: string; name: string; parentId?: string | null }) {
    await this.assertParent(data.tenantId, undefined, data.parentId);
    return this.repo.createCategory(data);
  }

  async findAll(tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant context is required');
    return this.repo.findAllCategories(tenantId);
  }

  async update(tenantId: string, id: string, data: { name?: string; parentId?: string | null }) {
    await this.assertParent(tenantId, id, data.parentId);
    return this.repo.updateCategory(id, data, tenantId);
  }

  async delete(tenantId: string, id: string) {
    await this.assertParent(tenantId, id, undefined);
    const productCount = await this.repo.countProductsByCategory(id);
    if (productCount > 0) throw new ConflictException(`No se puede eliminar la categoría: ${productCount} producto(s) están asociados`);
    const childCount = await this.repo.countChildCategories(id);
    if (childCount > 0) throw new ConflictException(`No se puede eliminar la categoría: tiene ${childCount} subcategoría(s)`);
    return this.repo.deleteCategory(id, tenantId);
  }

  private async assertParent(tenantId: string, id: string | undefined, parentId: string | null | undefined) {
    const categories = await this.findAll(tenantId);
    if (id && !categories.some(c => c.id === id)) throw new NotFoundException('Category not found');
    const visited = new Set<string>(id ? [id] : []);
    let current = parentId;
    while (current) {
      if (visited.has(current)) throw new BadRequestException('Category hierarchy must be acyclic');
      visited.add(current);
      const parent = categories.find(c => c.id === current);
      if (!parent) throw new BadRequestException('Parent category must belong to tenant');
      current = parent.parentId;
    }
  }
}

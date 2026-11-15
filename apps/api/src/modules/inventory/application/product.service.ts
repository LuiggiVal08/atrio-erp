import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class ProductService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: {
    tenantId: string; sku: string; barcode?: string; name: string; description?: string;
    categoryId?: string; unitPrice: number; costPrice: number;
    taxId?: string; isService: boolean;
    brandId?: string; baseUnit?: string; purchaseUnit?: string; conversionFactor?: number;
    minStock?: number; maxStock?: number; reorderPoint?: number;
    primarySupplierId?: string; supplierSku?: string;
  }) {
    if (!data.tenantId) throw new BadRequestException('Tenant context is required');
    this.validateValues(data);
    try {
      return await this.repo.createProduct(data);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('SKU or barcode already exists');
      throw error;
    }
  }

  async findAll(tenantId: string, filter?: {
    categoryId?: string; isActive?: boolean; search?: string;
    page?: number; pageSize?: number; sortBy?: string; sortDir?: 'asc' | 'desc';
  }) {
    if (!tenantId) throw new BadRequestException('Tenant context is required');
    return this.repo.findAllProducts(tenantId, filter);
  }

  async findById(tenantId: string, id: string) {
    if (!tenantId) throw new BadRequestException('Tenant context is required');
    const product = await this.repo.findProductById(id, tenantId);
    if (!product || product.tenantId !== tenantId) throw new NotFoundException('Product not found');
    return product;
  }

  async update(tenantId: string, id: string, data: any, userId?: string) {
    const existing = await this.findById(tenantId, id);
    this.validateValues({ ...existing, ...data });
    try {
      return await this.repo.updateProduct(id, data, tenantId, userId);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('SKU or barcode already exists');
      throw error;
    }
  }

  async generateBarcode(tenantId: string, id: string) {
    try {
      return await this.repo.generateProductBarcode(tenantId, id);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Barcode already exists');
      throw error;
    }
  }

  async softDelete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.repo.softDeleteProduct(id, tenantId);
  }

  private validateValues(data: any) {
    for (const field of ['unitPrice', 'costPrice', 'minStock', 'reorderPoint']) {
      if (data[field] !== undefined && (!Number.isFinite(data[field]) || data[field] < 0)) throw new BadRequestException(`${field} must be >= 0 and finite`);
    }
    if (data.conversionFactor !== undefined && (!Number.isFinite(data.conversionFactor) || data.conversionFactor <= 0)) throw new BadRequestException('Conversion factor must be positive');
    if (data.maxStock !== undefined && data.maxStock !== null && (!Number.isFinite(data.maxStock) || data.maxStock < Math.max(data.minStock ?? 0, data.reorderPoint ?? 0))) throw new BadRequestException('Maximum stock must cover minimum and reorder point');
  }
}

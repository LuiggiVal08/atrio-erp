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
    if (data.unitPrice < 0) throw new BadRequestException('Unit price must be >= 0');
    if (data.costPrice < 0) throw new BadRequestException('Cost price must be >= 0');
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
    return this.repo.findAllProducts(tenantId, filter);
  }

  async findById(id: string) {
    const product = await this.repo.findProductById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, data: any) {
    const existing = await this.repo.findProductById(id);
    if (!existing) throw new NotFoundException('Product not found');
    try {
      return await this.repo.updateProduct(id, data);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('SKU or barcode already exists');
      throw error;
    }
  }

  async generateBarcode(id: string) {
    const existing = await this.repo.findProductById(id);
    if (!existing) throw new NotFoundException('Product not found');
    return this.repo.generateProductBarcode(id);
  }

  async softDelete(id: string) {
    const existing = await this.repo.findProductById(id);
    if (!existing) throw new NotFoundException('Product not found');
    return this.repo.softDeleteProduct(id);
  }
}

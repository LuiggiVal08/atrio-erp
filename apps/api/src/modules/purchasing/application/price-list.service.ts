import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PriceListRepository } from '../domain/price-list.repository.interface';

@Injectable()
export class PriceListService {
  constructor(
    @Inject('PriceListRepository') private readonly repo: PriceListRepository,
  ) {}

  async create(tenantId: string, data: { name: string; vendorId?: string; validFrom?: string; validTo?: string }) {
    const createData: any = { tenantId, name: data.name };
    if (data.vendorId) createData.vendorId = data.vendorId;
    if (data.validFrom) createData.validFrom = new Date(data.validFrom);
    if (data.validTo) createData.validTo = new Date(data.validTo);
    return this.repo.create(createData);
  }

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async findById(id: string) {
    const list = await this.repo.findById(id);
    if (!list) throw new NotFoundException('Price list not found');
    return list;
  }

  async update(id: string, data: { name?: string; vendorId?: string; validFrom?: string; validTo?: string; isActive?: boolean }) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Price list not found');
    const updateData: any = { ...data };
    if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
    if (data.validTo) updateData.validTo = new Date(data.validTo);
    return this.repo.update(id, updateData);
  }

  async delete(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Price list not found');
    await this.repo.delete(id);
  }

  async addItem(priceListId: string, productId: string, unitPrice: number) {
    const list = await this.repo.findById(priceListId);
    if (!list) throw new NotFoundException('Price list not found');
    return this.repo.addItem({ priceListId, productId, unitPrice });
  }

  async removeItem(priceListId: string, itemId: string) {
    const list = await this.repo.findById(priceListId);
    if (!list) throw new NotFoundException('Price list not found');
    await this.repo.removeItem(itemId);
  }

  async findItems(priceListId: string) {
    const list = await this.repo.findById(priceListId);
    if (!list) throw new NotFoundException('Price list not found');
    return this.repo.findItems(priceListId);
  }
}

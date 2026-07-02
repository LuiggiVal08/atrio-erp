import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PriceListRepository } from '../domain/price-list.repository.interface';
import { PriceList, PriceListItem } from '../domain/price-list.entity';

@Injectable()
export class PrismaPriceListRepository implements PriceListRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(r: any): PriceList {
    return new PriceList(r.id, r.tenantId, r.name, r.vendorId, r.validFrom, r.validTo, r.isActive, r.createdAt, r.updatedAt);
  }

  private mapItem(r: any): PriceListItem {
    return new PriceListItem(r.id, r.priceListId, r.productId, r.unitPrice, r.createdAt);
  }

  async create(data: { tenantId: string; name: string; vendorId?: string; validFrom?: Date; validTo?: Date }): Promise<PriceList> {
    const r = await this.prisma.priceList.create({ data });
    return this.map(r);
  }

  async findAll(tenantId: string): Promise<PriceList[]> {
    const records = await this.prisma.priceList.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => this.map(r));
  }

  async findById(id: string): Promise<PriceList | null> {
    const r = await this.prisma.priceList.findUnique({ where: { id }, include: { items: true } });
    if (!r) return null;
    return new PriceList(r.id, r.tenantId, r.name, r.vendorId, r.validFrom, r.validTo, r.isActive, r.createdAt, r.updatedAt, r.items.map(i => this.mapItem(i)));
  }

  async update(id: string, data: Partial<{ name: string; vendorId: string | null; validFrom: Date | null; validTo: Date | null; isActive: boolean }>): Promise<PriceList> {
    const r = await this.prisma.priceList.update({ where: { id }, data });
    return this.map(r);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.priceList.deleteMany({ where: { id } });
  }

  async addItem(data: { priceListId: string; productId: string; unitPrice: number }): Promise<PriceListItem> {
    const r = await this.prisma.priceListItem.create({ data });
    return this.mapItem(r);
  }

  async removeItem(itemId: string): Promise<void> {
    await this.prisma.priceListItem.deleteMany({ where: { id: itemId } });
  }

  async findItems(priceListId: string): Promise<PriceListItem[]> {
    const records = await this.prisma.priceListItem.findMany({ where: { priceListId }, orderBy: { createdAt: 'asc' } });
    return records.map(r => this.mapItem(r));
  }
}

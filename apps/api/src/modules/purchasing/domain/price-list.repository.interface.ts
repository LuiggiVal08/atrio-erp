import { PriceList, PriceListItem } from './price-list.entity';

export interface PriceListRepository {
  create(data: { tenantId: string; name: string; vendorId?: string; validFrom?: Date; validTo?: Date }): Promise<PriceList>;
  findAll(tenantId: string): Promise<PriceList[]>;
  findById(id: string): Promise<PriceList | null>;
  update(id: string, data: Partial<{ name: string; vendorId: string | null; validFrom: Date | null; validTo: Date | null; isActive: boolean }>): Promise<PriceList>;
  delete(id: string): Promise<void>;
  addItem(data: { priceListId: string; productId: string; unitPrice: number }): Promise<PriceListItem>;
  removeItem(itemId: string): Promise<void>;
  findItems(priceListId: string): Promise<PriceListItem[]>;
}

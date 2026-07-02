import { SalesReturn } from './sales-return.entity';

export interface SalesReturnRepository {
  create(data: {
    tenantId: string; invoiceId: string; reason: string;
    subtotal: number; taxAmount: number; total: number;
  }): Promise<SalesReturn>;
  findByTenant(tenantId: string): Promise<SalesReturn[]>;
  findById(id: string): Promise<SalesReturn | null>;
  updateStatus(id: string, status: string): Promise<SalesReturn>;
  delete(id: string): Promise<void>;
}

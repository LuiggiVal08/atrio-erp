import { SalesReturn } from './sales-return.entity';

export interface SalesReturnRepository {
  create(data: {
    tenantId: string; invoiceId: string; reason: string;
    subtotal: number; taxAmount: number; total: number;
    reasonCode?: string; productCondition?: string; destination?: string;
    resolution?: string; warehouseId?: string; cashRegisterId?: string; userId?: string;
    lines?: unknown[];
  }): Promise<SalesReturn>;
  findByTenant(tenantId: string): Promise<SalesReturn[]>;
  findById(id: string): Promise<SalesReturn | null>;
  updateStatus(id: string, status: string): Promise<SalesReturn>;
  delete(id: string): Promise<void>;
}

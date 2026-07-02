import { Commission } from './commission.entity';

export interface CommissionRepository {
  create(data: {
    tenantId: string; invoiceId: string; salespersonId: string;
    invoiceTotal: number; commissionRate: number; commissionAmount: number;
    currency: string;
  }): Promise<Commission>;
  findByTenant(tenantId: string): Promise<Commission[]>;
  findById(id: string): Promise<Commission | null>;
  findBySalesperson(tenantId: string, salespersonId: string): Promise<Commission[]>;
  updateStatus(id: string, status: string, paidAt?: Date): Promise<Commission>;
  getSummary(tenantId: string): Promise<{ pending: number; paid: number; total: number }>;
}

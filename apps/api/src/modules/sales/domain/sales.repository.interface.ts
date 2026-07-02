import { SalesOrder } from './sales-order.entity';
import { SalesInvoice } from './sales-invoice.entity';

export interface SalesRepository {
  createOrder(data: {
    tenantId: string; documentId: string; clientId: string;
    subtotal: number; taxAmount: number; total: number; currency: string; notes?: string;
  }): Promise<SalesOrder>;
  findOrdersByTenant(tenantId: string): Promise<SalesOrder[]>;
  findOrderById(id: string): Promise<SalesOrder | null>;
  updateOrderStatus(id: string, status: string): Promise<SalesOrder>;
  updateOrder(id: string, data: Partial<{
    clientId: string; subtotal: number; taxAmount: number; total: number;
    currency: string; notes: string | null;
  }>): Promise<SalesOrder>;
  deleteOrder(id: string): Promise<void>;

  createInvoice(data: {
    tenantId: string; documentId: string; salesOrderId?: string;
    clientId: string; subtotal: number; taxAmount: number; total: number;
    currency: string; currencyRate?: number; notes?: string;
    salespersonId?: string; commissionRate?: number;
  }): Promise<SalesInvoice>;
  findInvoicesByTenant(tenantId: string): Promise<SalesInvoice[]>;
  findInvoiceById(id: string): Promise<SalesInvoice | null>;
  updateInvoiceStatus(id: string, status: string): Promise<SalesInvoice>;
  updateInvoice(id: string, data: Partial<{
    clientId: string; subtotal: number; taxAmount: number; total: number;
    currency: string; currencyRate: number | null; notes: string | null;
  }>): Promise<SalesInvoice>;
  deleteInvoice(id: string): Promise<void>;
  payInvoice(id: string, paymentMethodId: string): Promise<SalesInvoice>;
}

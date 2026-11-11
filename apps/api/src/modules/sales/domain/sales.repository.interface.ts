import type { SalesOrder } from './sales-order.entity';
import type { OrderLine } from './order-line.entity';
import type { SalesInvoice } from './sales-invoice.entity';
import type { Money } from './money.vo';
import type { CustomerSnapshot } from './customer-snapshot.vo';
import type { SalesOrderStatus } from './sales-order-status';

export interface CreateOrderData {
  tenantId: string;
  documentId?: string | null;
  clientId: string;
  customerSnapshot: Omit<CustomerSnapshot, 'update'>;
  currency: string;
  exchangeRate?: number | null;
  notes?: string | null;
  type?: string;
  lines?: CreateOrderLineData[];
}

export interface CreateOrderLineData {
  productId: string;
  productName: string;
  productSku?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface UpdateOrderData {
  clientId?: string;
  customerSnapshot?: Omit<CustomerSnapshot, 'update'>;
  notes?: string | null;
  lines?: CreateOrderLineData[];
  documentId?: string | null;
  status?: string;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
}

export interface SalesRepository {
  createOrder(data: CreateOrderData): Promise<SalesOrder>;
  findOrdersByTenant(tenantId: string): Promise<SalesOrder[]>;
  findOrderById(id: string): Promise<SalesOrder | null>;
  updateOrderStatus(id: string, status: SalesOrderStatus | string): Promise<SalesOrder>;
  updateOrder(id: string, data: UpdateOrderData): Promise<SalesOrder>;
  deleteOrder(id: string): Promise<void>;
  addLine(saleId: string, line: CreateOrderLineData, lineNumber: number): Promise<SalesOrder>;
  removeLine(saleId: string, lineId: string): Promise<SalesOrder>;
  updateLineQuantity(saleId: string, lineId: string, quantity: number, lineTotal: number): Promise<SalesOrder>;

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

import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseReturn } from './purchase-return.entity';

export interface ReceiptContext { tenantId: string; userId: string }
export interface ReceiptLine { lineId: string; quantity: number; productId?: string; warehouseId?: string }
export interface ReceiptRequest { operationId: string; lines?: ReceiptLine[]; complete?: boolean }
export interface ReceiptEvent {
  eventType: 'document.received'; tenantId: string; documentId: string;
  documentType: 'purchase_order'; timestamp: string; triggeredBy: string;
  metadata: { operationId: string; lines: Array<Required<ReceiptLine>> };
}

export interface OrderLineInfo {
  lineId: string;
  description?: string;
  unitPrice?: number;
  productId: string | null;
  warehouseId: string | null;
  quantity: number;
  receivedQuantity: number | null;
}

export interface PurchasingRepository {
  createOrder(data: {
    tenantId: string; documentId: string; vendorId: string;
    subtotal: number; taxAmount: number; total: number; currency: string; notes?: string; expectedDate?: string;
  }): Promise<PurchaseOrder>;
  findOrdersByTenant(tenantId: string): Promise<PurchaseOrder[]>;
  findOrderById(id: string): Promise<PurchaseOrder | null>;
  findVendorDeliveryDays(tenantId: string, vendorId: string): Promise<number | null>;
  updateOrderStatus(id: string, status: string): Promise<PurchaseOrder>;
  updateOrder(id: string, data: Partial<{ vendorId: string; subtotal: number; taxAmount: number; total: number; currency: string; notes: string | null; status: string; receivedAt: Date | null; expectedDate: Date | null }>): Promise<PurchaseOrder>;
  deleteOrder(id: string): Promise<void>;
  createReturn(data: {
    tenantId: string; purchaseOrderId: string; reason: string; subtotal: number; taxAmount: number; total: number;
    reasonCode?: string; resolution?: string; supplierCreditNo?: string; warehouseId?: string; userId?: string; lines?: unknown[];
  }): Promise<PurchaseReturn>;
  findReturnsByOrder(purchaseOrderId: string): Promise<PurchaseReturn[]>;
  findReturnsByTenant(tenantId: string): Promise<PurchaseReturn[]>;
  findReturnById(id: string): Promise<PurchaseReturn | null>;
  updateReturnStatus(id: string, status: string): Promise<PurchaseReturn>;
  deleteReturn(id: string): Promise<void>;
  findOrderLines(orderId: string): Promise<OrderLineInfo[]>;
  updateLineReceivedQuantity(lineId: string, quantity: number): Promise<void>;
  receiveOrder(id: string, request: ReceiptRequest, context: ReceiptContext): Promise<{ order: PurchaseOrder; event: ReceiptEvent }>;
  transitionReturnStatus(id: string, tenantId: string, expectedStatus: string, status: string): Promise<PurchaseReturn | null>;
  validateReturnLines(tenantId: string, lines: Array<{ productId: string; warehouseId: string; quantity: number }>): Promise<void>;
}

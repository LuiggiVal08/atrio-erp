import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseReturn } from './purchase-return.entity';

export interface OrderLineInfo {
  lineId: string;
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
}

import type { PurchasingOrder } from './purchasing-order.entity';
import type { GoodsReceipt } from './goods-receipt.entity';

export interface PurchasingV2Repository {
  // Purchase Orders
  createOrder(order: PurchasingOrder): Promise<PurchasingOrder>;
  findOrderById(id: string): Promise<PurchasingOrder | null>;
  findOrdersByTenant(tenantId: string): Promise<PurchasingOrder[]>;
  updateOrder(order: PurchasingOrder): Promise<PurchasingOrder>;

  // Goods Receipts
  createReceipt(receipt: GoodsReceipt): Promise<GoodsReceipt>;
  findReceiptById(id: string): Promise<GoodsReceipt | null>;
  findReceiptByPurchaseOrderId(purchasingOrderId: string): Promise<GoodsReceipt | null>;
  updateReceipt(receipt: GoodsReceipt): Promise<GoodsReceipt>;
}

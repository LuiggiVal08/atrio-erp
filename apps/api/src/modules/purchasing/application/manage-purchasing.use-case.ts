import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { PurchasingV2Repository } from '../domain/purchasing-v2.repository.interface';
import { PurchasingOrder } from '../domain/purchasing-order.entity';
import { PurchasingOrderLine } from '../domain/purchasing-order-line.entity';
import { GoodsReceipt } from '../domain/goods-receipt.entity';
import { GoodsReceiptLine } from '../domain/goods-receipt-line.entity';
import { SupplierSnapshot } from '../domain/supplier-snapshot.vo';
import { ProductSnapshot } from '../domain/product-snapshot.vo';
import {
  purchaseOrderCreated,
  purchaseOrderApproved,
  goodsReceiptStarted,
  goodsReceiptCompleted,
} from '../domain/domain-events';

@Injectable()
export class ManagePurchasingUseCase {
  constructor(
    @Inject('PurchasingV2Repository') private readonly repo: PurchasingV2Repository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(params: {
    tenantId: string;
    supplierId: string;
    supplierName: string;
    supplierTaxId?: string | null;
    supplierEmail?: string | null;
    supplierPhone?: string | null;
    lines: Array<{
      productId: string;
      productSku: string;
      productName: string;
      productUnit?: string | null;
      warehouseId?: string | null;
      orderedQuantity: number;
      unitCost: number;
      taxRate?: number;
      discountRate?: number;
    }>;
    notes?: string | null;
  }): Promise<PurchasingOrder> {
    const supplierSnapshot = new SupplierSnapshot(
      params.supplierId,
      params.supplierName,
      params.supplierTaxId ?? null,
      params.supplierEmail ?? null,
      params.supplierPhone ?? null,
    );

    const lines = params.lines.map(l => PurchasingOrderLine.create({
      productSnapshot: new ProductSnapshot(
        l.productId,
        l.productSku,
        l.productName,
        l.productUnit ?? null,
        l.warehouseId ?? null,
      ),
      orderedQuantity: l.orderedQuantity,
      unitCost: l.unitCost,
      taxRate: l.taxRate,
      discountRate: l.discountRate,
    }));

    const order = PurchasingOrder.draft({
      tenantId: params.tenantId,
      supplierSnapshot,
      lines,
      notes: params.notes ?? null,
    });

    const saved = await this.repo.createOrder(order);
    this.eventEmitter.emit('purchasing.order.created', purchaseOrderCreated(saved.id, saved.tenantId));
    return saved;
  }

  async approveOrder(purchaseOrderId: string): Promise<PurchasingOrder> {
    const order = await this.repo.findOrderById(purchaseOrderId);
    if (!order) throw new Error('Purchase order not found');

    const approved = order.approve();
    const saved = await this.repo.updateOrder(approved);
    this.eventEmitter.emit('purchasing.order.approved', purchaseOrderApproved(saved.id, saved.tenantId));
    return saved;
  }

  async startReceiving(params: {
    purchaseOrderId: string;
    receivedAt: Date;
  }): Promise<{ order: PurchasingOrder; receipt: GoodsReceipt }> {
    const order = await this.repo.findOrderById(params.purchaseOrderId);
    if (!order) throw new Error('Purchase order not found');

    const existing = await this.repo.findReceiptByPurchaseOrderId(params.purchaseOrderId);
    if (existing) throw new Error('A goods receipt already exists for this purchase order');

    const receivingOrder = order.startReceiving();

    const receipt = GoodsReceipt.create({
      purchasingOrderId: params.purchaseOrderId,
      tenantId: order.tenantId,
      receivedAt: params.receivedAt,
      lines: order.lines.map(l => GoodsReceiptLine.create({
        purchasingOrderLineId: l.id,
        receivedQuantity: 0,
        damagedQuantity: 0,
      })),
    });

    const savedOrder = await this.repo.updateOrder(receivingOrder);
    const savedReceipt = await this.repo.createReceipt(receipt);

    this.eventEmitter.emit(
      'purchasing.receiving.started',
      goodsReceiptStarted(savedOrder.id, savedReceipt.id, savedOrder.tenantId),
    );

    return { order: savedOrder, receipt: savedReceipt };
  }

  async receiveGoods(params: {
    goodsReceiptId: string;
    lines: Array<{
      purchasingOrderLineId: string;
      receivedQuantity: number;
      damagedQuantity?: number;
      notes?: string | null;
    }>;
  }): Promise<{ order: PurchasingOrder; receipt: GoodsReceipt }> {
    const receipt = await this.repo.findReceiptById(params.goodsReceiptId);
    if (!receipt) throw new Error('Goods receipt not found');

    const order = await this.repo.findOrderById(receipt.purchasingOrderId);
    if (!order) throw new Error('Purchase order not found');

    const grLines = params.lines.map(l => GoodsReceiptLine.create({
      purchasingOrderLineId: l.purchasingOrderLineId,
      receivedQuantity: l.receivedQuantity,
      damagedQuantity: l.damagedQuantity,
      notes: l.notes,
    }));

    const updatedReceipt = receipt.replaceLines(grLines).receive();

    const updatedPOLines = updatedReceipt.buildUpdatedPOLines([...order.lines]);
    const completedOrder = order.complete(updatedPOLines);

    const savedReceipt = await this.repo.updateReceipt(updatedReceipt);
    const savedOrder = await this.repo.updateOrder(completedOrder);

    const eventLines = grLines.map(l => {
      const poLine = order.lines.find(ol => ol.id === l.purchasingOrderLineId);
      return {
        productId: poLine?.productSnapshot.productId ?? '',
        warehouseId: poLine?.productSnapshot.warehouseId ?? null,
        receivedQuantity: l.receivedQuantity,
        damagedQuantity: l.damagedQuantity,
      };
    });

    this.eventEmitter.emit(
      'purchasing.receiving.completed',
      goodsReceiptCompleted(savedOrder.id, savedReceipt.id, savedOrder.tenantId, eventLines),
    );

    return { order: savedOrder, receipt: savedReceipt };
  }

  async getOrder(purchaseOrderId: string): Promise<{ order: PurchasingOrder; receipt: GoodsReceipt | null }> {
    const order = await this.repo.findOrderById(purchaseOrderId);
    if (!order) throw new Error('Purchase order not found');
    const receipt = await this.repo.findReceiptByPurchaseOrderId(purchaseOrderId);
    return { order, receipt };
  }

  async listOrders(tenantId: string): Promise<PurchasingOrder[]> {
    return this.repo.findOrdersByTenant(tenantId);
  }
}

import { Injectable } from '@nestjs/common';
import type { PurchasingV2Repository } from '../domain/purchasing-v2.repository.interface';
import { PurchasingOrder } from '../domain/purchasing-order.entity';
import { GoodsReceipt } from '../domain/goods-receipt.entity';
import { PurchasingOrderLine } from '../domain/purchasing-order-line.entity';
import { GoodsReceiptLine } from '../domain/goods-receipt-line.entity';
import { SupplierSnapshot } from '../domain/supplier-snapshot.vo';
import { ProductSnapshot } from '../domain/product-snapshot.vo';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class PrismaPurchasingV2Repository implements PurchasingV2Repository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(order: PurchasingOrder): Promise<PurchasingOrder> {
    const saved = await this.prisma.purchasingOrder.create({
      data: {
        id: order.id,
        tenantId: order.tenantId,
        status: order.status,
        supplierId: order.supplierSnapshot.supplierId,
        supplierName: order.supplierSnapshot.name,
        supplierTaxId: order.supplierSnapshot.taxId,
        supplierEmail: order.supplierSnapshot.email,
        supplierPhone: order.supplierSnapshot.phone,
        notes: order.notes,
        version: order.version,
        lines: {
          create: order.lines.map(l => ({
            id: l.id,
            productId: l.productSnapshot.productId,
            productSku: l.productSnapshot.sku,
            productName: l.productSnapshot.name,
            productUnit: l.productSnapshot.unit,
            warehouseId: l.productSnapshot.warehouseId,
            orderedQuantity: l.orderedQuantity,
            unitCost: l.unitCost,
            taxRate: l.taxRate,
            discountRate: l.discountRate,
            totalCost: l.totalCost,
            receivedQuantity: l.receivedQuantity,
          })),
        },
      },
      include: { lines: true },
    });
    return this.mapOrder(saved);
  }

  async findOrderById(id: string): Promise<PurchasingOrder | null> {
    const row = await this.prisma.purchasingOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    return row ? this.mapOrder(row) : null;
  }

  async findOrdersByTenant(tenantId: string): Promise<PurchasingOrder[]> {
    const rows = await this.prisma.purchasingOrder.findMany({
      where: { tenantId },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => this.mapOrder(r));
  }

  async updateOrder(order: PurchasingOrder): Promise<PurchasingOrder> {
    const saved = await this.prisma.purchasingOrder.update({
      where: { id: order.id },
      data: {
        status: order.status,
        notes: order.notes,
        completedAt: order.completedAt,
        version: { increment: 1 },
        lines: {
          updateMany: order.lines.map(l => ({
            where: { id: l.id },
            data: {
              receivedQuantity: l.receivedQuantity,
            },
          })),
        },
      },
      include: { lines: true },
    });
    return this.mapOrder(saved);
  }

  async createReceipt(receipt: GoodsReceipt): Promise<GoodsReceipt> {
    const saved = await this.prisma.goodsReceipt.create({
      data: {
        id: receipt.id,
        purchasingOrderId: receipt.purchasingOrderId,
        tenantId: receipt.tenantId,
        status: receipt.status,
        receivedAt: receipt.receivedAt,
        notes: receipt.notes,
        lines: {
          create: receipt.lines.map(l => ({
            id: l.id,
            purchasingOrderLineId: l.purchasingOrderLineId,
            receivedQuantity: l.receivedQuantity,
            damagedQuantity: l.damagedQuantity,
            notes: l.notes,
          })),
        },
      },
      include: { lines: true },
    });
    return this.mapReceipt(saved);
  }

  async findReceiptById(id: string): Promise<GoodsReceipt | null> {
    const row = await this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: { lines: true },
    });
    return row ? this.mapReceipt(row) : null;
  }

  async findReceiptByPurchaseOrderId(purchasingOrderId: string): Promise<GoodsReceipt | null> {
    const row = await this.prisma.goodsReceipt.findFirst({
      where: { purchasingOrderId },
      include: { lines: true },
    });
    return row ? this.mapReceipt(row) : null;
  }

  async updateReceipt(receipt: GoodsReceipt): Promise<GoodsReceipt> {
    const saved = await this.prisma.goodsReceipt.update({
      where: { id: receipt.id },
      data: {
        status: receipt.status,
        notes: receipt.notes,
      },
      include: { lines: true },
    });
    return this.mapReceipt(saved);
  }

  private mapOrder(row: any): PurchasingOrder {
    return PurchasingOrder.fromPersistence({
      id: row.id,
      tenantId: row.tenantId,
      status: row.status,
      supplierSnapshot: new SupplierSnapshot(
        row.supplierId,
        row.supplierName,
        row.supplierTaxId,
        row.supplierEmail,
        row.supplierPhone,
      ),
      lines: row.lines.map((l: any) => new PurchasingOrderLine(
        l.id,
        new ProductSnapshot(l.productId, l.productSku, l.productName, l.productUnit, l.warehouseId),
        l.orderedQuantity,
        l.unitCost,
        l.taxRate,
        l.discountRate,
        l.totalCost,
        l.receivedQuantity,
      )),
      notes: row.notes,
      completedAt: row.completedAt,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private mapReceipt(row: any): GoodsReceipt {
    return GoodsReceipt.fromPersistence({
      id: row.id,
      purchasingOrderId: row.purchasingOrderId,
      tenantId: row.tenantId,
      status: row.status,
      receivedAt: row.receivedAt,
      lines: row.lines.map((l: any) => new GoodsReceiptLine(
        l.id,
        l.purchasingOrderLineId,
        l.receivedQuantity,
        l.damagedQuantity,
        l.notes,
      )),
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PurchasingRepository, OrderLineInfo } from '../domain/purchasing.repository.interface';
import { PurchaseOrder } from '../domain/purchase-order.entity';
import { PurchaseReturn } from '../domain/purchase-return.entity';

@Injectable()
export class PrismaPurchasingRepository implements PurchasingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(r: any): PurchaseOrder {
    return new PurchaseOrder(r.id, r.tenantId, r.documentId, r.vendorId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.notes, r.createdAt, r.updatedAt);
  }

  private mapReturn(r: any): PurchaseReturn {
    return new PurchaseReturn(r.id, r.tenantId, r.purchaseOrderId, r.reason, r.subtotal, r.taxAmount, r.total, r.status, r.returnedAt, r.createdAt, r.updatedAt);
  }

  async createOrder(data: { tenantId: string; documentId: string; vendorId: string; subtotal: number; taxAmount: number; total: number; currency: string; notes?: string; expectedDate?: string }): Promise<PurchaseOrder> {
    const r = await this.prisma.purchaseOrder.create({ data: { ...data, notes: data.notes ?? null, expectedDate: (data as any).expectedDate ? new Date((data as any).expectedDate) : undefined } });
    return this.map(r);
  }

  async findOrdersByTenant(tenantId: string): Promise<PurchaseOrder[]> {
    const records = await this.prisma.purchaseOrder.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => this.map(r));
  }

  async findOrderById(id: string): Promise<PurchaseOrder | null> {
    const r = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!r) return null;
    return this.map(r);
  }

  async updateOrderStatus(id: string, status: string): Promise<PurchaseOrder> {
    const r = await this.prisma.purchaseOrder.update({ where: { id }, data: { status } });
    return this.map(r);
  }

  async updateOrder(id: string, data: Partial<{ vendorId: string; subtotal: number; taxAmount: number; total: number; currency: string; notes: string | null; status: string; receivedAt: Date | null; expectedDate: Date | null }>): Promise<PurchaseOrder> {
    const r = await this.prisma.purchaseOrder.update({ where: { id }, data });
    return this.map(r);
  }

  async deleteOrder(id: string): Promise<void> {
    await this.prisma.purchaseOrder.deleteMany({ where: { id } });
  }

  async createReturn(data: { tenantId: string; purchaseOrderId: string; reason: string; subtotal: number; taxAmount: number; total: number }): Promise<PurchaseReturn> {
    const r = await this.prisma.purchaseReturn.create({ data });
    return this.mapReturn(r);
  }

  async findReturnsByOrder(purchaseOrderId: string): Promise<PurchaseReturn[]> {
    const records = await this.prisma.purchaseReturn.findMany({ where: { purchaseOrderId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => this.mapReturn(r));
  }

  async findReturnsByTenant(tenantId: string): Promise<PurchaseReturn[]> {
    const records = await this.prisma.purchaseReturn.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => this.mapReturn(r));
  }

  async findReturnById(id: string): Promise<PurchaseReturn | null> {
    const r = await this.prisma.purchaseReturn.findUnique({ where: { id } });
    if (!r) return null;
    return this.mapReturn(r);
  }

  async updateReturnStatus(id: string, status: string): Promise<PurchaseReturn> {
    const r = await this.prisma.purchaseReturn.update({ where: { id }, data: { status } });
    return this.mapReturn(r);
  }

  async deleteReturn(id: string): Promise<void> {
    await this.prisma.purchaseReturn.deleteMany({ where: { id } });
  }

  async findOrderLines(orderId: string): Promise<OrderLineInfo[]> {
    const order = await this.prisma.purchaseOrder.findUnique({ where: { id: orderId }, select: { documentId: true } });
    if (!order) return [];
    const lines = await this.prisma.documentLine.findMany({
      where: { documentId: order.documentId },
      orderBy: { lineNumber: 'asc' },
    });
    return lines.map(l => ({
      lineId: l.id,
      productId: l.productId,
      warehouseId: l.warehouseId,
      quantity: Number(l.quantity),
      receivedQuantity: l.receivedQuantity ? Number(l.receivedQuantity) : null,
    }));
  }

  async updateLineReceivedQuantity(lineId: string, quantity: number): Promise<void> {
    await this.prisma.documentLine.update({
      where: { id: lineId },
      data: { receivedQuantity: quantity },
    });
  }
}

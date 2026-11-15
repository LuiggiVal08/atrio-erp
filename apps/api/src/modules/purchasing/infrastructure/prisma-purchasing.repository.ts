import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PurchasingRepository, OrderLineInfo, ReceiptRequest, ReceiptContext, ReceiptEvent } from '../domain/purchasing.repository.interface';
import { PurchaseOrder } from '../domain/purchase-order.entity';
import { PurchaseReturn } from '../domain/purchase-return.entity';

@Injectable()
export class PrismaPurchasingRepository implements PurchasingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(r: any): PurchaseOrder {
    return new PurchaseOrder(r.id, r.tenantId, r.documentId, r.vendorId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.notes, r.createdAt, r.updatedAt, r.expectedDate ?? null, r.receivedAt ?? null);
  }

  private mapReturn(r: any): PurchaseReturn {
    return new PurchaseReturn(
      r.id, r.tenantId, r.purchaseOrderId, r.reason, r.subtotal, r.taxAmount, r.total,
      r.status, r.returnedAt, r.createdAt, r.updatedAt,
      r.reasonCode, r.resolution, r.warehouseId, r.supplierCreditNo, r.userId, r.lines ?? [],
    );
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

  async findVendorDeliveryDays(tenantId: string, vendorId: string): Promise<number | null> {
    const partner = await this.prisma.partner.findFirst({
      where: { id: vendorId, tenantId },
      select: { deliveryDays: true },
    });
    return partner?.deliveryDays ?? null;
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

  async createReturn(data: any): Promise<PurchaseReturn> {
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
      description: l.description,
      unitPrice: Number(l.unitPrice),
      productId: l.productId,
      warehouseId: l.warehouseId,
      quantity: Number(l.quantity),
      receivedQuantity: l.receivedQuantity ? Number(l.receivedQuantity) : null,
    }));
  }

  async receiveOrder(id: string, request: ReceiptRequest, context: ReceiptContext): Promise<{ order: PurchaseOrder; event: ReceiptEvent }> {
    return this.prisma.$transaction(async tx => {
      // Serialize batches and their replay check on the same order, not merely line writes.
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM purchase_orders WHERE id = ${id}::uuid AND tenant_id = ${context.tenantId}::uuid FOR UPDATE`;
      if (!locked.length) throw new NotFoundException('Purchase order not found');
      const order = await tx.purchaseOrder.findUniqueOrThrow({ where: { id } });
      const canonical = JSON.stringify({ complete: !!request.complete, lines: (request.lines ?? []).map(l => ({
        lineId: l.lineId, quantity: l.quantity, productId: l.productId ?? null, warehouseId: l.warehouseId ?? null,
      })).sort((a, b) => a.lineId.localeCompare(b.lineId)) });
      const previous = await tx.documentEvent.findUnique({ where: { id: request.operationId } });
      if (previous) {
        const payload = previous.payload as unknown as { request: string; event: ReceiptEvent };
        if (previous.tenantId !== context.tenantId || previous.documentId !== order.documentId ||
          previous.eventType !== 'document.received' || payload?.request !== canonical) {
          throw new ConflictException('operationId was already used for a different receipt');
        }
        return { order: this.map(order), event: payload.event };
      }
      if (request.complete ? order.status !== 'partial' : !['approved', 'partial'].includes(order.status)) {
        throw new BadRequestException(request.complete ? 'Only partially received orders can be completed' : 'Only approved or partially received orders can be received');
      }
      const lines = await tx.documentLine.findMany({ where: { documentId: order.documentId }, orderBy: { lineNumber: 'asc' } });
      const incoming = request.complete ? lines.filter(l => new Prisma.Decimal(l.quantity).gt(l.receivedQuantity ?? 0)).map(l => ({
        lineId: l.id, quantity: new Prisma.Decimal(l.quantity).minus(l.receivedQuantity ?? 0).toNumber(),
      })) : request.lines ?? [];
      if (!incoming.length) throw new BadRequestException('At least one received line is required');
      const eventLines: ReceiptEvent['metadata']['lines'] = [];
      const seen = new Set<string>();
      for (const delta of incoming) {
        if (seen.has(delta.lineId) || !Number.isFinite(delta.quantity) || delta.quantity <= 0 ||
          new Prisma.Decimal(delta.quantity).decimalPlaces() > 4) throw new BadRequestException('Invalid receipt quantity or duplicate line');
        seen.add(delta.lineId);
        const line = lines.find(l => l.id === delta.lineId);
        if (!line) throw new NotFoundException('Receipt line not found on purchase order');
        const requested = delta as NonNullable<ReceiptRequest['lines']>[number];
        const productId = requested.productId ?? line.productId;
        const warehouseId = requested.warehouseId ?? line.warehouseId;
        if (!productId || !warehouseId) throw new BadRequestException('Every received line requires a product and destination warehouse');
        if (line.productId && productId !== line.productId) throw new BadRequestException('Receipt product must match the ordered product');
        await this.validateResources(tx, context.tenantId, productId, warehouseId);
        const received = new Prisma.Decimal(line.receivedQuantity ?? 0);
        const next = received.plus(delta.quantity);
        if (next.gt(line.quantity)) throw new BadRequestException('Received quantity exceeds the unreceived quantity');
        // Compare-and-increment also protects against writers outside this order lock.
        const result = await tx.documentLine.updateMany({
          where: { id: line.id, documentId: order.documentId, quantity: { gte: next }, receivedQuantity: line.receivedQuantity },
          data: { receivedQuantity: line.receivedQuantity === null ? delta.quantity : { increment: delta.quantity },
            productId, warehouseId: line.warehouseId ?? warehouseId },
        });
        if (result.count !== 1) throw new ConflictException('Receipt quantity changed; reload the order');
        line.receivedQuantity = next;
        eventLines.push({ lineId: line.id, productId, warehouseId, quantity: delta.quantity });
      }
      const status = lines.every(l => new Prisma.Decimal(l.receivedQuantity ?? 0).gte(l.quantity)) ? 'received' : 'partial';
      const updated = await tx.purchaseOrder.update({ where: { id }, data: { status, receivedAt: status === 'received' ? new Date() : null } });
      const event: ReceiptEvent = { eventType: 'document.received', tenantId: context.tenantId, documentId: id,
        documentType: 'purchase_order', timestamp: new Date().toISOString(), triggeredBy: context.userId,
        metadata: { operationId: request.operationId, lines: eventLines } };
      await tx.documentEvent.create({ data: { id: request.operationId, tenantId: context.tenantId, documentId: order.documentId,
        eventType: 'document.received', createdById: context.userId, payload: { request: canonical, event } as unknown as Prisma.InputJsonValue } });
      return { order: this.map(updated), event };
    });
  }

  private async validateResources(tx: Prisma.TransactionClient, tenantId: string, productId: string, warehouseId: string) {
    const product = await tx.product.findFirst({ where: { id: productId, tenantId, isActive: true, deletedAt: null }, select: { id: true } });
    const warehouse = await tx.warehouse.findFirst({ where: { id: warehouseId, tenantId, isActive: true }, select: { id: true } });
    if (!product || !warehouse) throw new BadRequestException('Product and active warehouse must belong to the effective tenant');
  }

  async validateReturnLines(tenantId: string, lines: Array<{ productId: string; warehouseId: string; quantity: number }>): Promise<void> {
    if (!lines.length) throw new BadRequestException('Return lines are required');
    for (const line of lines) {
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) throw new BadRequestException('Return quantities must be positive');
      await this.validateResources(this.prisma, tenantId, line.productId, line.warehouseId);
    }
  }

  async transitionReturnStatus(id: string, tenantId: string, expectedStatus: string, status: string): Promise<PurchaseReturn | null> {
    return this.prisma.$transaction(async tx => {
      const changed = await tx.purchaseReturn.updateMany({ where: { id, tenantId, status: expectedStatus }, data: { status } });
      if (!changed.count) return null;
      return this.mapReturn(await tx.purchaseReturn.findUniqueOrThrow({ where: { id } }));
    });
  }

  async updateLineReceivedQuantity(lineId: string, quantity: number): Promise<void> {
    await this.prisma.documentLine.update({
      where: { id: lineId },
      data: { receivedQuantity: quantity },
    });
  }
}

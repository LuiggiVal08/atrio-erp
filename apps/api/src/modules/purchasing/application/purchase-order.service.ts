import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PurchasingRepository, OrderLineInfo } from '../domain/purchasing.repository.interface';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @Inject('PurchasingRepository') private readonly repo: PurchasingRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: {
    tenantId: string; documentId: string; vendorId: string;
    subtotal: number; taxAmount: number; total: number; currency: string; notes?: string; expectedDate?: string;
  }) {
    return this.repo.createOrder(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findOrdersByTenant(tenantId);
  }

  async findById(id: string) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Purchase order not found');
    return order;
  }

  async update(id: string, data: Partial<{ vendorId: string; subtotal: number; taxAmount: number; total: number; currency: string; notes: string; expectedDate: string; status: string }>) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Purchase order not found');

    const updateData: any = { ...data };
    if (data.expectedDate) updateData.expectedDate = new Date(data.expectedDate);

    return this.repo.updateOrder(id, updateData);
  }

  async delete(id: string) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Purchase order not found');
    await this.repo.deleteOrder(id);
  }

  async approve(id: string) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Purchase order not found');
    if (order.status !== 'pending') throw new BadRequestException('Only pending purchase orders can be approved');
    return this.repo.updateOrderStatus(id, 'approved');
  }

  async returnOrder(id: string, data: { reason: string; subtotal: number; taxAmount: number; total: number; lines: Array<{ productId: string; warehouseId: string; quantity: number; unitPrice: number }> }) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Purchase order not found');
    if (order.status !== 'received') throw new BadRequestException('Only received purchase orders can be returned');

    const ret = await this.repo.createReturn({ tenantId: order.tenantId, purchaseOrderId: id, reason: data.reason, subtotal: data.subtotal, taxAmount: data.taxAmount, total: data.total });

    this.eventEmitter.emit('document.returned', {
      eventType: 'document.returned',
      tenantId: order.tenantId,
      documentId: id,
      documentType: 'purchase_return',
      timestamp: new Date().toISOString(),
      triggeredBy: null,
      metadata: { lines: data.lines },
    });

    return ret;
  }

  private buildLinesForEvent(lines: OrderLineInfo[], receivedMap: Map<string, number>): Array<{ productId: string; warehouseId: string; quantity: number }> {
    const result: Array<{ productId: string; warehouseId: string; quantity: number }> = [];
    for (const line of lines) {
      const qty = receivedMap.get(line.lineId) ?? (line.quantity - (line.receivedQuantity ?? 0));
      if (qty > 0 && line.productId && line.warehouseId) {
        result.push({ productId: line.productId, warehouseId: line.warehouseId, quantity: qty });
      }
    }
    return result;
  }

  private async determineReceiveStatus(orderId: string, lines: OrderLineInfo[], receivedMap: Map<string, number>): Promise<'partial' | 'received'> {
    let allFullyReceived = true;
    for (const line of lines) {
      const received = receivedMap.get(line.lineId) ?? (line.receivedQuantity ?? 0) + 0;
      if (received < line.quantity) {
        allFullyReceived = false;
        break;
      }
    }
    return allFullyReceived ? 'received' : 'partial';
  }

  async receive(id: string, dto?: { lines: Array<{ lineId: string; quantity: number }> }) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Purchase order not found');
    if (order.status === 'received') throw new Error('Purchase order already received');

    if (dto && dto.lines.length > 0) {
      const orderLines = await this.repo.findOrderLines(id);
      const lineMap = new Map(orderLines.map(l => [l.lineId, l]));

      const receivedMap = new Map<string, number>();
      for (const incoming of dto.lines) {
        const line = lineMap.get(incoming.lineId);
        if (!line) throw new NotFoundException(`Line ${incoming.lineId} not found on order ${id}`);
        const alreadyReceived = line.receivedQuantity ?? 0;
        const newReceived = alreadyReceived + incoming.quantity;
        if (newReceived > line.quantity) throw new BadRequestException(`Quantity ${newReceived} exceeds ordered ${line.quantity} for line ${incoming.lineId}`);
        await this.repo.updateLineReceivedQuantity(incoming.lineId, newReceived);
        receivedMap.set(incoming.lineId, newReceived);
      }

      const status = await this.determineReceiveStatus(id, orderLines, receivedMap);
      const updated = await this.repo.updateOrder(id, { status, receivedAt: status === 'received' ? new Date() : undefined });

      this.eventEmitter.emit('document.received', {
        eventType: 'document.received',
        tenantId: order.tenantId,
        documentId: id,
        documentType: 'purchase_order',
        timestamp: new Date().toISOString(),
        triggeredBy: null,
        metadata: { lines: this.buildLinesForEvent(orderLines, receivedMap) },
      });

      return updated;
    }

    const updated = await this.repo.updateOrder(id, { status: 'received', receivedAt: new Date() });

    this.eventEmitter.emit('document.received', {
      eventType: 'document.received',
      tenantId: order.tenantId,
      documentId: id,
      documentType: 'purchase_order',
      timestamp: new Date().toISOString(),
      triggeredBy: null,
      metadata: { lines: [] },
    });

    return updated;
  }

  async completeReceive(id: string) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Purchase order not found');
    if (order.status !== 'partial') throw new BadRequestException('Only partially received orders can be completed');
    const updated = await this.repo.updateOrder(id, { status: 'received', receivedAt: new Date() });

    const orderLines = await this.repo.findOrderLines(id);
    const remainingLines = orderLines.filter(l => (l.receivedQuantity ?? 0) < l.quantity && l.productId && l.warehouseId);

    if (remainingLines.length > 0) {
      this.eventEmitter.emit('document.received', {
        eventType: 'document.received',
        tenantId: order.tenantId,
        documentId: id,
        documentType: 'purchase_order',
        timestamp: new Date().toISOString(),
        triggeredBy: null,
        metadata: {
          lines: remainingLines.map(l => ({
            productId: l.productId,
            warehouseId: l.warehouseId,
            quantity: l.quantity - (l.receivedQuantity ?? 0),
          })),
        },
      });
    }

    return updated;
  }
}

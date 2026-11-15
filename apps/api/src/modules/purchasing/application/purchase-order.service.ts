import { Injectable, Inject, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { PurchasingRepository, ReceiptContext, ReceiptLine } from '../domain/purchasing.repository.interface';
import { CreateDocumentUseCase } from '@/modules/document-engine/application/create-document.use-case';
import { DocumentType } from '@/modules/document-engine/domain/document.entity';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @Inject('PurchasingRepository') private readonly repo: PurchasingRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly createDocument: CreateDocumentUseCase,
  ) {}

  async create(data: {
    tenantId: string; createdById: string; documentId?: string; vendorId: string;
    subtotal: number; taxAmount: number; total: number; currency: string; notes?: string; expectedDate?: string;
  }) {
    const documentId = data.documentId ?? await this.createPurchaseDocument(data);
    const expectedDate = data.expectedDate ?? await this.defaultExpectedDate(data.tenantId, data.vendorId);
    return this.repo.createOrder({
      tenantId: data.tenantId,
      documentId,
      vendorId: data.vendorId,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      total: data.total,
      currency: data.currency,
      notes: data.notes,
      expectedDate,
    });
  }

  private async createPurchaseDocument(data: {
    tenantId: string; createdById: string; subtotal: number; taxAmount: number; currency: string; notes?: string;
  }): Promise<string> {
    const taxRate = data.subtotal > 0 ? (data.taxAmount / data.subtotal) * 100 : 0;
    const document = await this.createDocument.execute(
      {
        documentType: DocumentType.PURCHASE_ORDER,
        currency: data.currency,
        notes: data.notes,
        lines: [
          {
            description: 'Purchase order',
            quantity: 1,
            unitPrice: data.subtotal,
            taxRate,
          },
        ],
      },
      { tenantId: data.tenantId, userId: data.createdById },
    );
    return document.id;
  }

  private async defaultExpectedDate(tenantId: string, vendorId: string): Promise<string | undefined> {
    const deliveryDays = await this.repo.findVendorDeliveryDays(tenantId, vendorId);
    if (deliveryDays == null) return undefined;

    const date = new Date();
    date.setDate(date.getDate() + deliveryDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async findAll(tenantId: string) {
    return this.repo.findOrdersByTenant(tenantId);
  }

  async findById(id: string, tenantId?: string) {
    const order = await this.repo.findOrderById(id);
    if (!order || (tenantId && order.tenantId !== tenantId)) throw new NotFoundException('Purchase order not found');
    return { ...order, lines: await this.repo.findOrderLines(id) };
  }

  async update(id: string, data: Partial<{ vendorId: string; subtotal: number; taxAmount: number; total: number; currency: string; notes: string; expectedDate: string; status: string }>, tenantId?: string) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Purchase order not found');

    if (tenantId && order.tenantId !== tenantId) throw new NotFoundException('Purchase order not found');
    if (data.status && data.status !== order.status) throw new BadRequestException('Use purchase order lifecycle actions to change status');
    const updateData: any = { ...data };
    if (data.expectedDate) updateData.expectedDate = new Date(data.expectedDate);

    return this.repo.updateOrder(id, updateData);
  }

  async delete(id: string, tenantId?: string) {
    const order = await this.repo.findOrderById(id);
    if (!order || (tenantId && order.tenantId !== tenantId)) throw new NotFoundException('Purchase order not found');
    if (['partial', 'received'].includes(order.status)) throw new BadRequestException('Received orders cannot be deleted');
    await this.repo.deleteOrder(id);
  }

  async approve(id: string, tenantId?: string) {
    const order = await this.repo.findOrderById(id);
    if (!order || (tenantId && order.tenantId !== tenantId)) throw new NotFoundException('Purchase order not found');
    if (order.status !== 'pending') throw new BadRequestException('Only pending purchase orders can be approved');
    return this.repo.updateOrderStatus(id, 'approved');
  }

  async returnOrder(id: string, data: {
    reason: string; reasonCode?: string; resolution?: string; supplierCreditNo?: string; warehouseId?: string;
    subtotal: number; taxAmount: number; total: number;
    lines: Array<{ productId: string; warehouseId: string; quantity: number; unitPrice: number }>;
    userId?: string;
  }, tenantId?: string) {
    const order = await this.repo.findOrderById(id);
    if (!order || (tenantId && order.tenantId !== tenantId)) throw new NotFoundException('Purchase order not found');
    if (order.status !== 'received') throw new BadRequestException('Only received purchase orders can be returned');

    await this.repo.validateReturnLines(order.tenantId, data.lines);
    const ret = await this.repo.createReturn({
      tenantId: order.tenantId,
      purchaseOrderId: id,
      reason: data.reason,
      reasonCode: data.reasonCode,
      resolution: data.resolution ?? 'supplier_credit',
      supplierCreditNo: data.supplierCreditNo,
      warehouseId: data.warehouseId,
      userId: data.userId,
      lines: data.lines,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      total: data.total,
    });

    return ret;
  }

  async receive(id: string, dto?: { operationId?: string; lines: ReceiptLine[] }, context?: ReceiptContext) {
    if (!dto?.lines?.length) throw new BadRequestException('At least one received line is required');
    const seen = new Set<string>();
    for (const line of dto.lines) {
      if (!line.lineId || seen.has(line.lineId) || !Number.isFinite(line.quantity) || line.quantity <= 0 ||
        Math.abs(line.quantity * 10000 - Math.round(line.quantity * 10000)) > 1e-7) {
        throw new BadRequestException('Receipt lines must be unique and quantities positive with at most four decimals');
      }
      seen.add(line.lineId);
    }
    if (!context) throw new BadRequestException('Receipt tenant and actor are required');
    const result = await this.repo.receiveOrder(id, { operationId: dto.operationId ?? randomUUID(), lines: dto.lines }, context);
    await this.dispatchReceipt(result.event);
    return result.order;
  }

  async completeReceive(id: string, dto: { operationId?: string } = {}, context?: ReceiptContext) {
    if (!context) throw new BadRequestException('Receipt tenant and actor are required');
    const result = await this.repo.receiveOrder(id, { operationId: dto.operationId ?? randomUUID(), complete: true }, context);
    await this.dispatchReceipt(result.event);
    return result.order;
  }

  private async dispatchReceipt(event: unknown) {
    try {
      await this.eventEmitter.emitAsync('document.received', event);
    } catch {
      throw new ServiceUnavailableException('Receipt persisted but stock dispatch failed; retry the same operation');
    }
  }
}

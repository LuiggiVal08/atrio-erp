import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SalesRepository } from '@/modules/sales/domain/sales.repository.interface';
import { SalesOrder } from '@/modules/sales/domain/sales-order.entity';
import { Money } from '@/modules/sales/domain/money.vo';
import { CustomerSnapshot } from '@/modules/sales/domain/customer-snapshot.vo';
import { CurrencySnapshot } from '@/modules/sales/domain/currency-snapshot.vo';
import { OrderLine } from '@/modules/sales/domain/order-line.entity';
import { SalesOrderStatus } from '@/modules/sales/domain/sales-order-status';
import { CreateDocumentUseCase } from '@/modules/document-engine/application/create-document.use-case';
import { SubmitDocumentUseCase } from '@/modules/document-engine/application/submit-document.use-case';
import { ApproveDocumentUseCase } from '@/modules/document-engine/application/approve-document.use-case';
import { TransitionDocumentUseCase } from '@/modules/document-engine/application/transition-document.use-case';
import { DocumentType, DocumentStatus } from '@/modules/document-engine/domain/document.entity';
import {
  saleCreated, saleUpdated, saleDeleted,
  saleLineAdded, saleLineRemoved, saleLineUpdated,
  saleCheckoutCompleted, salePaymentCompleted,
  type SaleDomainEvent,
} from '@/modules/sales/domain/domain-events';
import { AuditService } from '@/common/audit/audit.service';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BusinessMetricsService } from '@/common/metrics/business-metrics.service';

@Injectable()
export class PosSaleService {
  constructor(
    @Inject('SalesRepository') private readonly salesRepo: SalesRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly submitDocumentUseCase: SubmitDocumentUseCase,
    private readonly approveDocumentUseCase: ApproveDocumentUseCase,
    private readonly transitionDocumentUseCase: TransitionDocumentUseCase,
    private readonly metrics: BusinessMetricsService,
  ) {}

  async createDraft(data: {
    tenantId: string;
    userId: string;
    partnerId: string;
    partnerName: string;
    partnerTaxId?: string | null;
    partnerAddress?: string | null;
    partnerEmail?: string | null;
    partnerPhone?: string | null;
    notes?: string | null;
    lines?: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<SalesOrder> {
    const customerSnapshot = new CustomerSnapshot(
      data.partnerId,
      data.partnerName,
      data.partnerTaxId ?? null,
      data.partnerAddress ?? null,
      data.partnerEmail ?? null,
      data.partnerPhone ?? null,
    );

    const lineEntities = await this.resolveLines(data.lines ?? [], 'VED');

    const sale = SalesOrder.draft({
      tenantId: data.tenantId,
      customerSnapshot,
      lines: lineEntities,
      notes: data.notes ?? null,
      type: 'pos',
    });

    // Recalculate from lines
    const saleWithTotals = lineEntities.length > 0 ? sale.replaceLines(lineEntities) : sale;

    const orderData = {
      tenantId: data.tenantId,
      clientId: data.partnerId,
      customerSnapshot: {
        partnerId: customerSnapshot.partnerId,
        name: customerSnapshot.name,
        taxId: customerSnapshot.taxId,
        address: customerSnapshot.address,
        email: customerSnapshot.email,
        phone: customerSnapshot.phone,
      },
      currency: 'VED',
      notes: data.notes ?? null,
      type: 'pos',
      lines: lineEntities.length > 0 ? lineEntities.map(l => ({
        productId: l.productId,
        productName: l.productName,
        productSku: l.productSku,
        quantity: l.quantity,
        unitPrice: l.unitPrice.amount,
        lineTotal: l.lineTotal.amount,
      })) : undefined,
    };

    const created = await this.salesRepo.createOrder(orderData);

    this.emit(saleCreated(created.id, data.tenantId, data.userId));
    await this.audit.log({
      tenantId: data.tenantId,
      userId: data.userId,
      action: 'CREATE',
      entityType: 'pos_sale',
      entityId: created.id,
      after: { status: SalesOrderStatus.DRAFT, total: created.total },
    });

    return created;
  }

  async findById(id: string): Promise<SalesOrder> {
    const sale = await this.salesRepo.findOrderById(id);
    if (!sale) throw new NotFoundException('POS sale not found');
    return sale;
  }

  async findAll(tenantId: string): Promise<SalesOrder[]> {
    const orders = await this.salesRepo.findOrdersByTenant(tenantId);
    return orders.filter(o => o.type === 'pos');
  }

  async updateDraft(
    id: string,
    data: {
      userId: string;
      partnerId?: string;
      partnerName?: string;
      partnerTaxId?: string | null;
      partnerAddress?: string | null;
      partnerEmail?: string | null;
      partnerPhone?: string | null;
      notes?: string | null;
      lines?: Array<{
        id?: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        lineTotal?: number;
      }>;
    },
  ): Promise<SalesOrder> {
    const sale = await this.salesRepo.findOrderById(id);
    if (!sale) throw new NotFoundException('POS sale not found');

    sale.ensureCanModify();
    sale.checkTenant(sale.tenantId);

    const changes: string[] = [];

    let updatedSnapshot = sale.customerSnapshot;
    if (data.partnerId || data.partnerName) {
      updatedSnapshot = updatedSnapshot.update({
        name: data.partnerName ?? updatedSnapshot.name,
        taxId: data.partnerTaxId !== undefined ? data.partnerTaxId : updatedSnapshot.taxId,
        address: data.partnerAddress !== undefined ? data.partnerAddress : updatedSnapshot.address,
        email: data.partnerEmail !== undefined ? data.partnerEmail : updatedSnapshot.email,
        phone: data.partnerPhone !== undefined ? data.partnerPhone : updatedSnapshot.phone,
      });
      changes.push('customer');
    }

    const beforeLines = [...sale.lines];
    let lineEntities: OrderLine[] | undefined;

    if (data.lines !== undefined) {
      lineEntities = data.lines.map((l, i) => {
        const existing = beforeLines.find(bl => bl.id === l.id);
        const unitPrice = new Money(l.unitPrice, sale.currencySnapshot.code);
        if (existing) {
          if (existing.quantity !== l.quantity) {
            this.emit(saleLineUpdated(sale.id, sale.tenantId, data.userId, existing.productName, existing.quantity, l.quantity));
            changes.push(`line_${existing.id}_qty`);
          }
          return existing.withQuantity(l.quantity);
        }
        return OrderLine.create({
          productId: l.productId,
          productName: '',
          productSku: null,
          quantity: l.quantity,
          unitPrice,
        });
      });

      // Emit removed events
      for (const bl of beforeLines) {
        if (!data.lines.find(l => l.id === bl.id)) {
          this.emit(saleLineRemoved(sale.id, sale.tenantId, data.userId, bl.productName));
          changes.push(`line_${bl.id}_removed`);
        }
      }

      // Emit added events
      for (const nl of lineEntities) {
        if (!beforeLines.find(bl => bl.id === nl.id)) {
          this.emit(saleLineAdded(sale.id, sale.tenantId, data.userId, nl.productName, nl.quantity));
          changes.push(`line_${nl.id}_added`);
        }
      }

      changes.push('lines');
    }

    // Resolve product names for new lines
    if (lineEntities) {
      const resolved = await this.resolveProductNames(lineEntities);
      lineEntities = resolved;
    }

    const updateData: any = {};
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
      changes.push('notes');
    }

    const updated = await this.salesRepo.updateOrder(id, {
      clientId: updatedSnapshot.partnerId,
      customerSnapshot: {
        partnerId: updatedSnapshot.partnerId,
        name: updatedSnapshot.name,
        taxId: updatedSnapshot.taxId,
        address: updatedSnapshot.address,
        email: updatedSnapshot.email,
        phone: updatedSnapshot.phone,
      },
      notes: updateData.notes,
      lines: lineEntities ? lineEntities.map(l => ({
        productId: l.productId,
        productName: l.productName,
        productSku: l.productSku,
        quantity: l.quantity,
        unitPrice: l.unitPrice.amount,
        lineTotal: l.lineTotal.amount,
      })) : undefined,
    });

    this.emit(saleUpdated(updated.id, updated.tenantId, data.userId, changes));
    await this.audit.log({
      tenantId: updated.tenantId,
      userId: data.userId,
      action: 'UPDATE',
      entityType: 'pos_sale',
      entityId: updated.id,
      before: { status: sale.status, total: sale.total },
      after: { status: updated.status, total: updated.total, changes },
    });

    return updated;
  }

  async deleteDraft(id: string, userId: string): Promise<void> {
    const sale = await this.salesRepo.findOrderById(id);
    if (!sale) throw new NotFoundException('POS sale not found');
    sale.ensureCanModify();

    await this.salesRepo.deleteOrder(id);
    this.emit(saleDeleted(id, sale.tenantId, userId));
    await this.audit.log({
      tenantId: sale.tenantId,
      userId,
      action: 'DELETE',
      entityType: 'pos_sale',
      entityId: id,
      before: { status: sale.status, total: sale.total },
    });
  }

  async requestCheckout(id: string, userId: string): Promise<SalesOrder> {
    const sale = await this.salesRepo.findOrderById(id);
    if (!sale) throw new NotFoundException('POS sale not found');

    sale.checkTenant(sale.tenantId);
    const checkedOut = sale.requestCheckout();

    const updated = await this.salesRepo.updateOrderStatus(id, SalesOrderStatus.PENDING_PAYMENT);
    await this.audit.log({
      tenantId: sale.tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'pos_sale',
      entityId: id,
      before: { status: SalesOrderStatus.DRAFT },
      after: { status: SalesOrderStatus.PENDING_PAYMENT },
    });

    return updated;
  }

  // ──────────────────────────────────────────────
  //  Slice 2 — Checkout + Payment
  // ──────────────────────────────────────────────

  async checkout(
    saleId: string,
    userId: string,
    tenantId: string,
    warehouseId: string,
  ): Promise<{ saleId: string; documentId: string; status: string; grandTotal: number }> {
    const start = performance.now();
    const sale = await this.salesRepo.findOrderById(saleId);
    if (!sale) throw new NotFoundException('POS sale not found');
    sale.checkTenant(tenantId);

    if (sale.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft sales can be checked out');
    }
    if (sale.lines.length === 0) {
      throw new BadRequestException('Cannot checkout a sale with no items');
    }

    const productIds = [...new Set(sale.lines.map(l => l.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, deletedAt: null },
      select: { id: true, name: true, unitPrice: true, taxId: true },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    const taxIds: string[] = [...new Set(products.map(p => p.taxId).filter((id): id is string => id !== null))];
    const taxes = taxIds.length > 0
      ? await this.prisma.localizationTax.findMany({
          where: { id: { in: taxIds }, isActive: true },
          select: { id: true, rate: true },
        })
      : [];
    const taxMap = new Map(taxes.map(t => [t.id, Number(t.rate)]));

    const docLines = sale.lines.map(line => {
      const product = productMap.get(line.productId);
      if (!product) throw new NotFoundException(`Product not found or inactive: ${line.productName}`);
      const finalUnitPrice = Number(product.unitPrice);
      const taxRate = product.taxId ? (taxMap.get(product.taxId) ?? 0) : 0;

      return {
        description: product.name,
        quantity: line.quantity,
        unitPrice: finalUnitPrice,
        taxRate,
        productId: line.productId,
        warehouseId,
      };
    });

    const document = await this.createDocumentUseCase.execute(
      { documentType: DocumentType.SALES_INVOICE, lines: docLines },
      { tenantId, userId },
    );

    await this.submitDocumentUseCase.execute(document.id, { tenantId, userId });

    const subtotal = Number(document.subtotal);
    const taxTotal = Number(document.taxTotal);
    const grandTotal = Number(document.grandTotal);

    const updated = await this.salesRepo.updateOrder(saleId, {
      documentId: document.id,
      status: SalesOrderStatus.PENDING_PAYMENT,
      subtotal,
      taxAmount: taxTotal,
      total: grandTotal,
    });

    this.emit(saleCheckoutCompleted(saleId, tenantId, userId, document.id, grandTotal));
    await this.audit.log({
      tenantId,
      userId,
      action: 'CHECKOUT',
      entityType: 'pos_sale',
      entityId: saleId,
      before: { status: SalesOrderStatus.DRAFT },
      after: { status: SalesOrderStatus.PENDING_PAYMENT, documentId: document.id, grandTotal },
    });

    this.metrics.observeCheckout(tenantId, performance.now() - start);
    return { saleId, documentId: document.id, status: SalesOrderStatus.PENDING_PAYMENT, grandTotal };
  }

  async pay(
    saleId: string,
    userId: string,
    tenantId: string,
    paymentMethodId: string,
    cashRegisterId: string,
  ): Promise<{ saleId: string; status: string; documentId: string }> {
    const start = performance.now();
    try {
      const result = await this.doPay(saleId, userId, tenantId, paymentMethodId, cashRegisterId, start);
      this.metrics.incrementPaymentsTotal(tenantId, 'ok');
      return result;
    } catch (err) {
      this.metrics.incrementPaymentError(tenantId, err.constructor?.name ?? 'unknown');
      throw err;
    } finally {
      this.metrics.observePayment(tenantId, performance.now() - start);
    }
  }

  private async doPay(
    saleId: string,
    userId: string,
    tenantId: string,
    paymentMethodId: string,
    cashRegisterId: string,
    _start: number,
  ): Promise<{ saleId: string; status: string; documentId: string }> {
    const sale = await this.salesRepo.findOrderById(saleId);
    if (!sale) throw new NotFoundException('POS sale not found');
    sale.checkTenant(tenantId);

    if (sale.status !== SalesOrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Sale must be in PendingPayment status to pay');
    }
    if (!sale.documentId) {
      throw new BadRequestException('Sale has no Document — checkout first');
    }

    const documentId = sale.documentId;
    const total = sale.total;

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId, tenantId },
    });
    if (!paymentMethod) throw new NotFoundException('Payment method not found');

    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id: cashRegisterId, tenantId },
    });
    if (!cashRegister) throw new NotFoundException('Cash register not found');

    const session = await this.prisma.posSession.findFirst({
      where: { cashRegisterId, status: 'open' },
    });
    if (!session) throw new BadRequestException('No open POS session for this cash register');

    await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.findUnique({
        where: { id: documentId },
        include: { lines: true },
      });
      if (!doc || doc.status !== DocumentStatus.PENDING_APPROVAL) {
        throw new BadRequestException('Document is not in PENDING_APPROVAL status');
      }

      // Lock stock rows with FOR UPDATE — prevents race conditions
      for (const line of doc.lines) {
        if (!line.productId || !line.warehouseId) continue;
        const [stockRow] = await tx.$queryRawUnsafe<Array<{ quantity: number; committed_quantity: number }>>(
          `SELECT quantity, committed_quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 FOR UPDATE`,
          line.productId,
          line.warehouseId,
        );
        const available = stockRow ? Number(stockRow.quantity) - Number(stockRow.committed_quantity ?? 0) : 0;
        if (available < Number(line.quantity)) {
          throw new BadRequestException(`Insufficient stock for product ${line.description}`);
        }
      }

      // Approve: PENDING_APPROVAL → APPROVED
      await tx.document.update({
        where: { id: documentId, tenantId, status: DocumentStatus.PENDING_APPROVAL },
        data: { status: DocumentStatus.APPROVED, approvedById: userId, approvedAt: new Date() },
      });
      await tx.documentEvent.create({
        data: {
          tenantId,
          documentId,
          eventType: 'document.approved',
          previousStatus: DocumentStatus.PENDING_APPROVAL,
          newStatus: DocumentStatus.APPROVED,
          payload: {
            approvedBy: userId,
            approvedAt: new Date().toISOString(),
            grandTotal: Number(doc.grandTotal),
            currency: doc.currency,
          },
          createdById: userId,
        },
      });

      // Deduct stock (safe because FOR UPDATE is held)
      for (const line of doc.lines) {
        if (!line.productId || !line.warehouseId) continue;
        await tx.stock.update({
          where: { productId_warehouseId: { productId: line.productId, warehouseId: line.warehouseId } },
          data: { quantity: { decrement: Number(line.quantity) } },
        });
        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            warehouseId: line.warehouseId,
            type: 'out',
            quantity: Number(line.quantity),
            referenceType: 'sales_invoice',
            referenceId: documentId,
            userId,
          },
        });
      }

      // Pay: APPROVED → PAID
      await tx.document.update({
        where: { id: documentId, tenantId, status: DocumentStatus.APPROVED },
        data: { status: DocumentStatus.PAID },
      });
      await tx.documentEvent.create({
        data: {
          tenantId,
          documentId,
          eventType: 'document.paid',
          previousStatus: DocumentStatus.APPROVED,
          newStatus: DocumentStatus.PAID,
          payload: { paidAt: new Date().toISOString() },
          createdById: userId,
        },
      });

      // Cash register + movement
      await tx.cashRegister.update({
        where: { id: cashRegisterId },
        data: { balance: { increment: total } },
      });
      await tx.cashMovement.create({
        data: {
          registerId: cashRegisterId,
          type: 'in',
          amount: total,
          referenceType: 'sales_invoice',
          referenceId: documentId,
          description: `Payment for POS sale ${saleId}`,
          userId,
        },
      });

      // Sales order
      await tx.salesOrder.update({
        where: { id: saleId },
        data: { status: SalesOrderStatus.PAID },
      });
    });

    this.emit(salePaymentCompleted(saleId, tenantId, userId, documentId, paymentMethodId, total));
    await this.audit.log({
      tenantId,
      userId,
      action: 'PAY',
      entityType: 'pos_sale',
      entityId: saleId,
      before: { status: SalesOrderStatus.PENDING_PAYMENT },
      after: { status: SalesOrderStatus.PAID, documentId, total },
    });

    return { saleId, status: SalesOrderStatus.PAID, documentId };
  }

  // --- Private ---

  private async resolveLines(
    lines: Array<{ productId: string; quantity: number; unitPrice: number }>,
    currency: string,
  ): Promise<OrderLine[]> {
    if (lines.length === 0) return [];
    const productIds = [...new Set(lines.map(l => l.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, deletedAt: null },
      select: { id: true, name: true, sku: true },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    return lines.map((l, i) => {
      const product = productMap.get(l.productId);
      if (!product) throw new NotFoundException(`Product not found: ${l.productId}`);
      const unitPrice = new Money(l.unitPrice, currency);
      return OrderLine.create({
        id: crypto.randomUUID(),
        lineNumber: i + 1,
        productId: l.productId,
        productName: product.name,
        productSku: product.sku ?? null,
        quantity: l.quantity,
        unitPrice,
        createdAt: new Date(),
      });
    });
  }

  private async resolveProductNames(lines: OrderLine[]): Promise<OrderLine[]> {
    const unnamed = lines.filter(l => !l.productName);
    if (unnamed.length === 0) return lines;

    const productIds = unnamed.map(l => l.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    return lines.map(l => {
      if (l.productName) return l;
      const product = productMap.get(l.productId);
      return new OrderLine(
        l.id,
        l.lineNumber,
        l.productId,
        product?.name ?? 'Unknown Product',
        product?.sku ?? l.productSku,
        l.quantity,
        l.unitPrice,
        l.lineTotal,
        l.createdAt,
      );
    });
  }

  private emit(event: SaleDomainEvent): void {
    this.eventEmitter.emit(event.eventType, event);
  }
}

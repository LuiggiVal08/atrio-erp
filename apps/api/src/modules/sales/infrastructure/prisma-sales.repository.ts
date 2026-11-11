import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { SalesRepository, CreateOrderData, CreateOrderLineData, UpdateOrderData } from '../domain/sales.repository.interface';
import { SalesOrder } from '../domain/sales-order.entity';
import { SalesInvoice } from '../domain/sales-invoice.entity';
import { Money } from '../domain/money.vo';
import { CustomerSnapshot } from '../domain/customer-snapshot.vo';
import { CurrencySnapshot } from '../domain/currency-snapshot.vo';
import { OrderLine } from '../domain/order-line.entity';
import { SalesOrderStatus, isValidStatus } from '../domain/sales-order-status';

@Injectable()
export class PrismaSalesRepository implements SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(data: CreateOrderData): Promise<SalesOrder> {
    const r = await this.prisma.salesOrder.create({
      data: {
        tenantId: data.tenantId,
        documentId: data.documentId ?? null,
        clientId: data.clientId,
        customerName: data.customerSnapshot.name,
        customerTaxId: data.customerSnapshot.taxId,
        customerAddress: data.customerSnapshot.address,
        customerEmail: data.customerSnapshot.email,
        customerPhone: data.customerSnapshot.phone,
        currency: data.currency,
        exchangeRate: data.exchangeRate ?? null,
        notes: data.notes ?? null,
        type: data.type ?? 'pos',
        status: SalesOrderStatus.DRAFT,
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        lines: data.lines && data.lines.length > 0 ? {
          create: data.lines.map((l, i) => ({
            lineNumber: i + 1,
            productId: l.productId,
            productName: l.productName,
            productSku: l.productSku ?? null,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          })),
        } : undefined,
      },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    return this.toOrder(r);
  }

  async findOrdersByTenant(tenantId: string): Promise<SalesOrder[]> {
    const records = await this.prisma.salesOrder.findMany({
      where: { tenantId },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toOrder(r));
  }

  async findOrderById(id: string): Promise<SalesOrder | null> {
    const r = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    if (!r) return null;
    return this.toOrder(r);
  }

  async updateOrderStatus(id: string, status: SalesOrderStatus | string): Promise<SalesOrder> {
    const r = await this.prisma.salesOrder.update({
      where: { id },
      data: { status },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    return this.toOrder(r);
  }

  async updateOrder(id: string, data: UpdateOrderData): Promise<SalesOrder> {
    const updateData: any = {};
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.documentId !== undefined) updateData.documentId = data.documentId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
    if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.customerSnapshot) {
      updateData.customerName = data.customerSnapshot.name;
      updateData.customerTaxId = data.customerSnapshot.taxId;
      updateData.customerAddress = data.customerSnapshot.address;
      updateData.customerEmail = data.customerSnapshot.email;
      updateData.customerPhone = data.customerSnapshot.phone;
    }
    if (data.lines !== undefined) {
      await this.prisma.salesOrderLine.deleteMany({ where: { salesOrderId: id } });
      const lineSubtotal = data.lines.reduce((s, l) => s + l.lineTotal, 0);
      if (updateData.subtotal === undefined) updateData.subtotal = lineSubtotal;
      if (updateData.total === undefined) updateData.total = lineSubtotal;
    }
    const r = await this.prisma.salesOrder.update({
      where: { id },
      data: updateData,
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    if (data.lines !== undefined) {
      for (let i = 0; i < data.lines.length; i++) {
        const l = data.lines[i];
        await this.prisma.salesOrderLine.create({
          data: {
            salesOrderId: id,
            lineNumber: i + 1,
            productId: l.productId,
            productName: l.productName,
            productSku: l.productSku ?? null,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          },
        });
      }
      const refreshed = await this.prisma.salesOrder.findUnique({
        where: { id },
        include: { lines: { orderBy: { lineNumber: 'asc' } } },
      });
      return this.toOrder(refreshed!);
    }
    return this.toOrder(r);
  }

  async deleteOrder(id: string): Promise<void> {
    await this.prisma.salesOrder.deleteMany({ where: { id } });
  }

  async addLine(saleId: string, line: CreateOrderLineData, lineNumber: number): Promise<SalesOrder> {
    await this.prisma.salesOrderLine.create({
      data: {
        salesOrderId: saleId,
        lineNumber,
        productId: line.productId,
        productName: line.productName,
        productSku: line.productSku ?? null,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      },
    });
    const sale = await this.prisma.salesOrder.findUnique({
      where: { id: saleId },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    if (!sale) throw new Error('Sale not found');
    const newSubtotal = sale.lines.reduce((s, l) => s + l.lineTotal, 0);
    await this.prisma.salesOrder.update({
      where: { id: saleId },
      data: { subtotal: newSubtotal, total: newSubtotal, taxAmount: 0 },
    });
    const updated = await this.prisma.salesOrder.findUnique({
      where: { id: saleId },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    return this.toOrder(updated!);
  }

  async removeLine(saleId: string, lineId: string): Promise<SalesOrder> {
    await this.prisma.salesOrderLine.delete({ where: { id: lineId } });
    const sale = await this.prisma.salesOrder.findUnique({
      where: { id: saleId },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    if (!sale) throw new Error('Sale not found');
    const newSubtotal = sale.lines.reduce((s, l) => s + l.lineTotal, 0);
    await this.prisma.salesOrder.update({
      where: { id: saleId },
      data: { subtotal: newSubtotal, total: newSubtotal, taxAmount: 0 },
    });
    const updated = await this.prisma.salesOrder.findUnique({
      where: { id: saleId },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    return this.toOrder(updated!);
  }

  async updateLineQuantity(saleId: string, lineId: string, quantity: number, lineTotal: number): Promise<SalesOrder> {
    await this.prisma.salesOrderLine.update({
      where: { id: lineId },
      data: { quantity, lineTotal },
    });
    const sale = await this.prisma.salesOrder.findUnique({
      where: { id: saleId },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    if (!sale) throw new Error('Sale not found');
    const newSubtotal = sale.lines.reduce((s, l) => s + l.lineTotal, 0);
    await this.prisma.salesOrder.update({
      where: { id: saleId },
      data: { subtotal: newSubtotal, total: newSubtotal, taxAmount: 0 },
    });
    const updated = await this.prisma.salesOrder.findUnique({
      where: { id: saleId },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
    return this.toOrder(updated!);
  }

  // --- Invoice methods unchanged ---

  async createInvoice(data: {
    tenantId: string; documentId: string; salesOrderId?: string;
    clientId: string; subtotal: number; taxAmount: number; total: number;
    currency: string; currencyRate?: number; notes?: string;
    salespersonId?: string; commissionRate?: number;
  }): Promise<SalesInvoice> {
    const r = await this.prisma.salesInvoice.create({
      data: { ...data, salesOrderId: data.salesOrderId ?? null, currencyRate: data.currencyRate ?? null, notes: data.notes ?? null, salespersonId: data.salespersonId ?? null, commissionRate: data.commissionRate ?? null },
    });
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.paidAt, r.paymentMethodId, r.createdAt, r.updatedAt);
  }

  async findInvoicesByTenant(tenantId: string): Promise<SalesInvoice[]> {
    const records = await this.prisma.salesInvoice.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.paidAt, r.paymentMethodId, r.createdAt, r.updatedAt));
  }

  async findInvoiceById(id: string): Promise<SalesInvoice | null> {
    const r = await this.prisma.salesInvoice.findUnique({ where: { id } });
    if (!r) return null;
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.paidAt, r.paymentMethodId, r.createdAt, r.updatedAt);
  }

  async updateInvoiceStatus(id: string, status: string): Promise<SalesInvoice> {
    const r = await this.prisma.salesInvoice.update({ where: { id }, data: { status } });
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.paidAt, r.paymentMethodId, r.createdAt, r.updatedAt);
  }

  async updateInvoice(id: string, data: Partial<{ clientId: string; subtotal: number; taxAmount: number; total: number; currency: string; currencyRate: number | null; notes: string | null }>): Promise<SalesInvoice> {
    const r = await this.prisma.salesInvoice.update({ where: { id }, data });
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.paidAt, r.paymentMethodId, r.createdAt, r.updatedAt);
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.prisma.salesInvoice.deleteMany({ where: { id } });
  }

  async payInvoice(id: string, paymentMethodId: string): Promise<SalesInvoice> {
    const r = await this.prisma.salesInvoice.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date(), paymentMethodId },
    });
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.paidAt, r.paymentMethodId, r.createdAt, r.updatedAt);
  }

  // --- Private helper ---

  private toOrder(r: any): SalesOrder {
    const status = isValidStatus(r.status) ? r.status as SalesOrderStatus : SalesOrderStatus.DRAFT;
    const lines = (r.lines ?? []).map((l: any) => new OrderLine(
      l.id, l.lineNumber, l.productId, l.productName, l.productSku, l.quantity,
      new Money(l.unitPrice, r.currency),
      new Money(l.lineTotal, r.currency),
      l.createdAt,
    ));
    return SalesOrder.fromPersistence({
      id: r.id,
      tenantId: r.tenantId,
      status,
      customerSnapshot: new CustomerSnapshot(
        r.clientId,
        r.customerName ?? '',
        r.customerTaxId ?? null,
        r.customerAddress ?? null,
        r.customerEmail ?? null,
        r.customerPhone ?? null,
      ),
      currencySnapshot: new CurrencySnapshot(r.currency, r.exchangeRate ?? null),
      lines,
      subtotal: r.subtotal,
      taxAmount: r.taxAmount,
      total: r.total,
      notes: r.notes,
      type: r.type,
      documentId: r.documentId ?? null,
      deliveredWarehouseId: r.deliveredWarehouseId ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }
}

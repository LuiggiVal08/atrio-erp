import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { SalesRepository } from '../domain/sales.repository.interface';
import { SalesOrder } from '../domain/sales-order.entity';
import { SalesInvoice } from '../domain/sales-invoice.entity';

@Injectable()
export class PrismaSalesRepository implements SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(data: { tenantId: string; documentId: string; clientId: string; subtotal: number; taxAmount: number; total: number; currency: string; notes?: string }): Promise<SalesOrder> {
    const r = await this.prisma.salesOrder.create({ data: { ...data, notes: data.notes ?? null } });
    return new SalesOrder(r.id, r.tenantId, r.documentId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.notes, r.createdAt, r.updatedAt);
  }

  async findOrdersByTenant(tenantId: string): Promise<SalesOrder[]> {
    const records = await this.prisma.salesOrder.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => new SalesOrder(r.id, r.tenantId, r.documentId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.notes, r.createdAt, r.updatedAt));
  }

  async findOrderById(id: string): Promise<SalesOrder | null> {
    const r = await this.prisma.salesOrder.findUnique({ where: { id } });
    if (!r) return null;
    return new SalesOrder(r.id, r.tenantId, r.documentId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.notes, r.createdAt, r.updatedAt);
  }

  async updateOrderStatus(id: string, status: string): Promise<SalesOrder> {
    const r = await this.prisma.salesOrder.update({ where: { id }, data: { status } });
    return new SalesOrder(r.id, r.tenantId, r.documentId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.notes, r.createdAt, r.updatedAt);
  }

  async updateOrder(id: string, data: Partial<{ clientId: string; subtotal: number; taxAmount: number; total: number; currency: string; notes: string | null }>): Promise<SalesOrder> {
    const r = await this.prisma.salesOrder.update({ where: { id }, data });
    return new SalesOrder(r.id, r.tenantId, r.documentId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.notes, r.createdAt, r.updatedAt);
  }

  async deleteOrder(id: string): Promise<void> {
    await this.prisma.salesOrder.deleteMany({ where: { id } });
  }

  async createInvoice(data: { tenantId: string; documentId: string; salesOrderId?: string; clientId: string; subtotal: number; taxAmount: number; total: number; currency: string; currencyRate?: number; notes?: string; salespersonId?: string; commissionRate?: number }): Promise<SalesInvoice> {
    const r = await this.prisma.salesInvoice.create({
      data: { ...data, salesOrderId: data.salesOrderId ?? null, currencyRate: data.currencyRate ?? null, notes: data.notes ?? null, salespersonId: data.salespersonId ?? null, commissionRate: data.commissionRate ?? null },
    });
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.createdAt, r.updatedAt);
  }

  async findInvoicesByTenant(tenantId: string): Promise<SalesInvoice[]> {
    const records = await this.prisma.salesInvoice.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.createdAt, r.updatedAt));
  }

  async findInvoiceById(id: string): Promise<SalesInvoice | null> {
    const r = await this.prisma.salesInvoice.findUnique({ where: { id } });
    if (!r) return null;
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.createdAt, r.updatedAt);
  }

  async updateInvoiceStatus(id: string, status: string): Promise<SalesInvoice> {
    const r = await this.prisma.salesInvoice.update({ where: { id }, data: { status } });
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.createdAt, r.updatedAt);
  }

  async updateInvoice(id: string, data: Partial<{ clientId: string; subtotal: number; taxAmount: number; total: number; currency: string; currencyRate: number | null; notes: string | null }>): Promise<SalesInvoice> {
    const r = await this.prisma.salesInvoice.update({ where: { id }, data });
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.createdAt, r.updatedAt);
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.prisma.salesInvoice.deleteMany({ where: { id } });
  }

  async payInvoice(id: string, paymentMethodId: string): Promise<SalesInvoice> {
    const r = await this.prisma.salesInvoice.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date(), paymentMethodId },
    });
    return new SalesInvoice(r.id, r.tenantId, r.documentId, r.salesOrderId, r.clientId, r.status, r.subtotal, r.taxAmount, r.total, r.currency, r.currencyRate, r.notes, r.salespersonId, r.commissionRate, r.createdAt, r.updatedAt);
  }
}

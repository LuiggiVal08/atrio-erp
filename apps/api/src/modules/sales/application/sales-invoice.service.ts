import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesRepository } from '../domain/sales.repository.interface';
import { CommissionService } from './commission.service';

@Injectable()
export class SalesInvoiceService {
  constructor(
    @Inject('SalesRepository') private readonly repo: SalesRepository,
    private readonly commissionService: CommissionService,
  ) {}

  async create(data: {
    tenantId: string; documentId: string; salesOrderId?: string;
    clientId: string; subtotal: number; taxAmount: number; total: number;
    currency: string; currencyRate?: number; notes?: string;
  }) {
    return this.repo.createInvoice(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findInvoicesByTenant(tenantId);
  }

  async findById(id: string) {
    const invoice = await this.repo.findInvoiceById(id);
    if (!invoice) throw new NotFoundException('Sales invoice not found');
    return invoice;
  }

  async approve(id: string) {
    const invoice = await this.repo.findInvoiceById(id);
    if (!invoice) throw new NotFoundException('Sales invoice not found');
    if (invoice.status !== 'pending') throw new Error('Only pending invoices can be approved');
    return this.repo.updateInvoiceStatus(id, 'approved');
  }

  async update(id: string, data: { clientId?: string; subtotal?: number; taxAmount?: number; total?: number; currency?: string; currencyRate?: number; notes?: string }) {
    const invoice = await this.repo.findInvoiceById(id);
    if (!invoice) throw new NotFoundException('Sales invoice not found');
    if (data.total !== undefined && data.total < 0) throw new BadRequestException('Total must be >= 0');
    return this.repo.updateInvoice(id, data as any);
  }

  async delete(id: string): Promise<void> {
    const invoice = await this.repo.findInvoiceById(id);
    if (!invoice) throw new NotFoundException('Sales invoice not found');
    await this.repo.deleteInvoice(id);
  }

  async pay(id: string, paymentMethodId: string) {
    const invoice = await this.repo.findInvoiceById(id);
    if (!invoice) throw new NotFoundException('Sales invoice not found');
    if (invoice.status === 'paid') throw new BadRequestException('Invoice is already paid');
    if (invoice.status === 'cancelled') throw new BadRequestException('Cannot pay a cancelled invoice');
    const paid = await this.repo.payInvoice(id, paymentMethodId);
    await this.commissionService.createFromInvoice(id);
    return paid;
  }
}

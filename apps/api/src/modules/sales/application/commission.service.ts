import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CommissionRepository } from '../domain/commission.repository.interface';
import { SalesRepository } from '../domain/sales.repository.interface';

@Injectable()
export class CommissionService {
  constructor(
    @Inject('CommissionRepository') private readonly commissionRepo: CommissionRepository,
    @Inject('SalesRepository') private readonly salesRepo: SalesRepository,
  ) {}

  async createFromInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.salesRepo.findInvoiceById(invoiceId);
    if (!invoice) throw new NotFoundException('Sales invoice not found');
    if (!invoice.salespersonId) return;
    const rate = invoice.commissionRate ?? 0.05;
    const amount = invoice.total * rate;
    await this.commissionRepo.create({
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      salespersonId: invoice.salespersonId,
      invoiceTotal: invoice.total,
      commissionRate: rate,
      commissionAmount: amount,
      currency: invoice.currency,
    });
  }

  async findAll(tenantId: string) {
    return this.commissionRepo.findByTenant(tenantId);
  }

  async findById(id: string) {
    const commission = await this.commissionRepo.findById(id);
    if (!commission) throw new NotFoundException('Commission not found');
    return commission;
  }

  async findBySalesperson(tenantId: string, salespersonId: string) {
    return this.commissionRepo.findBySalesperson(tenantId, salespersonId);
  }

  async pay(id: string, notes?: string) {
    const commission = await this.commissionRepo.findById(id);
    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status === 'paid') throw new BadRequestException('Commission is already paid');
    if (commission.status === 'cancelled') throw new BadRequestException('Cannot pay a cancelled commission');
    return this.commissionRepo.updateStatus(id, 'paid', new Date());
  }

  async cancel(id: string) {
    const commission = await this.commissionRepo.findById(id);
    if (!commission) throw new NotFoundException('Commission not found');
    if (commission.status === 'paid') throw new BadRequestException('Cannot cancel a paid commission');
    return this.commissionRepo.updateStatus(id, 'cancelled');
  }

  async getSummary(tenantId: string) {
    return this.commissionRepo.getSummary(tenantId);
  }
}

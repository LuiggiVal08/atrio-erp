import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesReturnRepository } from '../domain/sales-return.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommissionService } from './commission.service';

@Injectable()
export class SalesReturnService {
  constructor(
    @Inject('SalesReturnRepository') private readonly repo: SalesReturnRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly commissionService: CommissionService,
  ) {}

  async create(data: any) {
    if (data.total < 0) throw new BadRequestException('Total must be >= 0');
    if (!data.reasonCode) data.reasonCode = 'other';
    if (!data.productCondition) data.productCondition = 'saleable';
    if (!data.destination) data.destination = data.productCondition === 'saleable' ? 'sellable_stock' : 'quarantine';
    if (!data.resolution) data.resolution = 'credit_note';
    data.lines = data.lines ?? [];
    return this.repo.create(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findByTenant(tenantId);
  }

  async findById(id: string) {
    const ret = await this.repo.findById(id);
    if (!ret) throw new NotFoundException('Sales return not found');
    return ret;
  }

  async updateStatus(id: string, status: string) {
    const ret = await this.repo.findById(id);
    if (!ret) throw new NotFoundException('Sales return not found');
    if (!['draft', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
      throw new BadRequestException('Invalid sales return status');
    }
    const updated = await this.repo.updateStatus(id, status);
    if (status === 'approved' || status === 'completed') {
      await this.commissionService.adjustForReturn(ret.invoiceId, ret.total);
      this.eventEmitter.emit('document.returned', {
        eventType: 'document.returned',
        tenantId: ret.tenantId,
        documentId: id,
        documentType: 'sales_return',
        timestamp: new Date().toISOString(),
        triggeredBy: ret.userId ?? null,
        metadata: {
          invoiceId: ret.invoiceId,
          lines: ret.lines,
          productCondition: ret.productCondition,
          resolution: ret.resolution,
          cashRegisterId: ret.cashRegisterId,
          amount: ret.total,
        },
      });
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const ret = await this.repo.findById(id);
    if (!ret) throw new NotFoundException('Sales return not found');
    await this.repo.delete(id);
  }
}

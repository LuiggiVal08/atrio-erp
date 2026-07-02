import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesReturnRepository } from '../domain/sales-return.repository.interface';

@Injectable()
export class SalesReturnService {
  constructor(@Inject('SalesReturnRepository') private readonly repo: SalesReturnRepository) {}

  async create(data: { tenantId: string; invoiceId: string; reason: string; subtotal: number; taxAmount: number; total: number }) {
    if (data.total < 0) throw new BadRequestException('Total must be >= 0');
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
    return this.repo.updateStatus(id, status);
  }

  async delete(id: string): Promise<void> {
    const ret = await this.repo.findById(id);
    if (!ret) throw new NotFoundException('Sales return not found');
    await this.repo.delete(id);
  }
}

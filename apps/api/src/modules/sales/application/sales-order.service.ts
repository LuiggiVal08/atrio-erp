import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { SalesRepository } from '../domain/sales.repository.interface';
import { CustomerSnapshot } from '../domain/customer-snapshot.vo';
import { CurrencySnapshot } from '../domain/currency-snapshot.vo';


@Injectable()
export class SalesOrderService {
  constructor(@Inject('SalesRepository') private readonly repo: SalesRepository) {}

  async create(data: {
    tenantId: string; documentId?: string; clientId: string;
    subtotal: number; taxAmount: number; total: number; currency: string; notes?: string;
  }) {
    if (data.total < 0) throw new BadRequestException('Total must be >= 0');
    return this.repo.createOrder({
      tenantId: data.tenantId,
      documentId: data.documentId ?? null,
      clientId: data.clientId,
      customerSnapshot: new CustomerSnapshot(
        data.clientId,
        'Legacy Client',
        null, null, null, null,
      ),
      currency: data.currency,
      notes: data.notes ?? null,
      type: 'order',
    });
  }

  async findAll(tenantId: string) {
    return this.repo.findOrdersByTenant(tenantId);
  }

  async findById(id: string) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Sales order not found');
    return order;
  }

  async update(id: string, data: { clientId?: string; subtotal?: number; taxAmount?: number; total?: number; currency?: string; notes?: string }) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Sales order not found');
    if (data.total !== undefined && data.total < 0) throw new BadRequestException('Total must be >= 0');
    return this.repo.updateOrder(id, {
      clientId: data.clientId,
      notes: data.notes ?? null,
    });
  }

  async delete(id: string): Promise<void> {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Sales order not found');
    await this.repo.deleteOrder(id);
  }

  async updateStatus(id: string, status: string) {
    const order = await this.repo.findOrderById(id);
    if (!order) throw new NotFoundException('Sales order not found');
    return this.repo.updateOrderStatus(id, status);
  }
}

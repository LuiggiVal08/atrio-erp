import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesRepository } from '../domain/sales.repository.interface';

@Injectable()
export class SalesOrderService {
  constructor(@Inject('SalesRepository') private readonly repo: SalesRepository) {}

  async create(data: {
    tenantId: string; documentId: string; clientId: string;
    subtotal: number; taxAmount: number; total: number; currency: string; notes?: string;
  }) {
    if (data.total < 0) throw new BadRequestException('Total must be >= 0');
    return this.repo.createOrder(data);
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
    return this.repo.updateOrder(id, data as any);
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

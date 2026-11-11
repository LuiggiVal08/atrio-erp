import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { SalesReturnRepository } from '../domain/sales-return.repository.interface';
import { SalesReturn } from '../domain/sales-return.entity';

@Injectable()
export class PrismaSalesReturnRepository implements SalesReturnRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<SalesReturn> {
    const r = await this.prisma.salesReturn.create({ data });
    return this.map(r);
  }

  async findByTenant(tenantId: string): Promise<SalesReturn[]> {
    const records = await this.prisma.salesReturn.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => this.map(r));
  }

  async findById(id: string): Promise<SalesReturn | null> {
    const r = await this.prisma.salesReturn.findUnique({ where: { id } });
    if (!r) return null;
    return this.map(r);
  }

  async updateStatus(id: string, status: string): Promise<SalesReturn> {
    const r = await this.prisma.salesReturn.update({ where: { id }, data: { status } });
    return this.map(r);
  }

  private map(r: any): SalesReturn {
    return new SalesReturn(
      r.id, r.tenantId, r.invoiceId, r.reason, r.subtotal, r.taxAmount, r.total,
      r.status, r.returnedAt, r.createdAt, r.updatedAt,
      r.reasonCode, r.productCondition, r.destination, r.resolution,
      r.warehouseId, r.cashRegisterId, r.creditNoteId, r.userId, r.lines ?? [], r.refundedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.salesReturn.deleteMany({ where: { id } });
  }
}

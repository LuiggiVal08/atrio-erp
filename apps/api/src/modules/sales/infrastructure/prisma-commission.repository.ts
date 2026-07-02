import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CommissionRepository } from '../domain/commission.repository.interface';
import { Commission } from '../domain/commission.entity';

@Injectable()
export class PrismaCommissionRepository implements CommissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    tenantId: string; invoiceId: string; salespersonId: string;
    invoiceTotal: number; commissionRate: number; commissionAmount: number;
    currency: string;
  }): Promise<Commission> {
    const r = await this.prisma.salesCommission.create({ data });
    return this.toEntity(r);
  }

  async findByTenant(tenantId: string): Promise<Commission[]> {
    const records = await this.prisma.salesCommission.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toEntity(r));
  }

  async findById(id: string): Promise<Commission | null> {
    const r = await this.prisma.salesCommission.findUnique({ where: { id } });
    if (!r) return null;
    return this.toEntity(r);
  }

  async findBySalesperson(tenantId: string, salespersonId: string): Promise<Commission[]> {
    const records = await this.prisma.salesCommission.findMany({
      where: { tenantId, salespersonId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => this.toEntity(r));
  }

  async updateStatus(id: string, status: string, paidAt?: Date): Promise<Commission> {
    const r = await this.prisma.salesCommission.update({
      where: { id },
      data: { status: status as any, paidAt: paidAt ?? null },
    });
    return this.toEntity(r);
  }

  async getSummary(tenantId: string): Promise<{ pending: number; paid: number; total: number }> {
    const [pending, paid] = await Promise.all([
      this.prisma.salesCommission.count({ where: { tenantId, status: 'pending' } }),
      this.prisma.salesCommission.count({ where: { tenantId, status: 'paid' } }),
    ]);
    const total = pending + paid;
    return { pending, paid, total };
  }

  private toEntity(r: any): Commission {
    return new Commission(
      r.id, r.tenantId, r.invoiceId, r.salespersonId,
      Number(r.invoiceTotal), r.commissionRate, Number(r.commissionAmount),
      r.currency, r.status, r.notes, r.paidAt, r.createdAt, r.updatedAt,
    );
  }
}

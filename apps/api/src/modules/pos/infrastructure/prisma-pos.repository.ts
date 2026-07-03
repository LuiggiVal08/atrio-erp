import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PosRepository } from '../domain/pos.repository.interface';
import { PosSession } from '../domain/pos-session.entity';

@Injectable()
export class PrismaPosRepository implements PosRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(r: any): PosSession {
    return new PosSession(r.id, r.tenantId, r.cashRegisterId, r.userId, r.openingBalance, r.closingBalance, r.status, r.openedAt, r.closedAt, r.createdAt, r.updatedAt);
  }

  async createSession(data: { tenantId: string; cashRegisterId: string; userId: string; openingBalance: number }): Promise<PosSession> {
    const r = await this.prisma.posSession.create({ data: { ...data, status: 'open' } });
    return this.map(r);
  }

  async findSessionById(id: string): Promise<PosSession | null> {
    const r = await this.prisma.posSession.findUnique({ where: { id } });
    return r ? this.map(r) : null;
  }

  async findOpenSession(tenantId: string, cashRegisterId: string): Promise<PosSession | null> {
    const r = await this.prisma.posSession.findFirst({ where: { tenantId, cashRegisterId, status: 'open' } });
    return r ? this.map(r) : null;
  }

  async findSessionsByTenant(tenantId: string): Promise<PosSession[]> {
    const records = await this.prisma.posSession.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => this.map(r));
  }

  async closeSession(id: string, closingBalance: number): Promise<PosSession> {
    const r = await this.prisma.posSession.update({ where: { id }, data: { status: 'closed', closingBalance, closedAt: new Date() } });
    return this.map(r);
  }
}

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PosRepository } from '../domain/pos.repository.interface';

@Injectable()
export class PosSessionService {
  constructor(
    @Inject('PosRepository') private readonly repo: PosRepository,
  ) {}

  async open(data: { tenantId: string; cashRegisterId: string; userId: string; openingBalance: number; openingDenominations?: unknown }) {
    const existing = await this.repo.findOpenSession(data.tenantId, data.cashRegisterId);
    if (existing) throw new BadRequestException('A session is already open for this register');
    const sessions = await this.repo.findSessionsByTenant(data.tenantId);
    const openForUser = sessions.find((session) => session.status === 'open' && session.userId === data.userId);
    if (openForUser) throw new BadRequestException('Ya tiene una caja abierta');
    let openingDenominations = data.openingDenominations;
    if (!openingDenominations) {
      const previous = sessions
        .filter((session) =>
          session.cashRegisterId === data.cashRegisterId &&
          session.status === 'closed' &&
          session.closedAt &&
          session.closingDenominations,
        )
        .sort((a, b) => b.closedAt!.getTime() - a.closedAt!.getTime())[0];
      openingDenominations = previous?.closingDenominations;
    }
    return this.repo.createSession({ ...data, openingDenominations });
  }

  async close(id: string, closingBalance: number, details?: {
    closingDifference?: number;
    closingNote?: string;
    closingDenominations?: unknown;
  }, tenantId?: string) {
    const session = tenantId
      ? await this.repo.findSessionByTenant(id, tenantId)
      : await this.repo.findSessionById(id);
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'open') throw new BadRequestException('Session is not open');
    const difference = details?.closingDifference;
    const note = details?.closingNote?.trim();
    if (difference !== undefined && difference !== 0 && !note) {
      throw new BadRequestException('La observación es obligatoria cuando existe un sobrante o faltante');
    }
    return this.repo.closeSession(id, closingBalance, details);
  }

  async getCurrent(tenantId: string, cashRegisterId: string) {
    const session = await this.repo.findOpenSession(tenantId, cashRegisterId);
    return session;
  }

  async findAll(tenantId: string) {
    return this.repo.findSessionsByTenant(tenantId);
  }

  async findById(id: string, tenantId?: string) {
    const session = tenantId
      ? await this.repo.findSessionByTenant(id, tenantId)
      : await this.repo.findSessionById(id);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}

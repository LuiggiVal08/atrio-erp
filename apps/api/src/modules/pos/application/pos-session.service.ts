import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PosRepository } from '../domain/pos.repository.interface';

@Injectable()
export class PosSessionService {
  constructor(
    @Inject('PosRepository') private readonly repo: PosRepository,
  ) {}

  async open(data: { tenantId: string; cashRegisterId: string; userId: string; openingBalance: number }) {
    const existing = await this.repo.findOpenSession(data.tenantId, data.cashRegisterId);
    if (existing) throw new BadRequestException('A session is already open for this register');
    return this.repo.createSession(data);
  }

  async close(id: string, closingBalance: number) {
    const session = await this.repo.findSessionById(id);
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'open') throw new BadRequestException('Session is not open');
    return this.repo.closeSession(id, closingBalance);
  }

  async getCurrent(tenantId: string, cashRegisterId: string) {
    const session = await this.repo.findOpenSession(tenantId, cashRegisterId);
    return session;
  }

  async findAll(tenantId: string) {
    return this.repo.findSessionsByTenant(tenantId);
  }

  async findById(id: string) {
    const session = await this.repo.findSessionById(id);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CashPaymentsRepository } from '../domain/cash-payments.repository.interface';

@Injectable()
export class CashRegisterService {
  constructor(@Inject('CashPaymentsRepository') private readonly repo: CashPaymentsRepository) {}

  async create(data: { tenantId: string; name: string; currency: string }) {
    return this.repo.createRegister(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findAllRegisters(tenantId);
  }

  async softDelete(id: string) {
    return this.repo.softDeleteRegister(id);
  }
}

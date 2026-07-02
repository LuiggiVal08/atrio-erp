import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CashPaymentsRepository } from '../domain/cash-payments.repository.interface';

@Injectable()
export class CashMovementService {
  constructor(@Inject('CashPaymentsRepository') private readonly repo: CashPaymentsRepository) {}

  async register(data: {
    cashRegisterId: string; type: 'in' | 'out'; amount: number;
    referenceType?: string; referenceId?: string; description?: string; userId: string;
  }) {
    if (data.amount <= 0) throw new BadRequestException('Amount must be positive');

    if (data.type === 'out') {
      const register = await this.repo.findRegisterById(data.cashRegisterId);
      if (!register) throw new NotFoundException('Cash register not found');
      if (register.balance < data.amount) throw new BadRequestException('Insufficient balance');
    }

    const delta = data.type === 'in' ? data.amount : -data.amount;
    await this.repo.updateRegisterBalance(data.cashRegisterId, delta);
    return this.repo.createMovement(data);
  }

  async getMovements(cashRegisterId: string) {
    return this.repo.findMovements(cashRegisterId);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CashPaymentsRepository } from '../domain/cash-payments.repository.interface';

@Injectable()
export class BankAccountService {
  constructor(@Inject('CashPaymentsRepository') private readonly repo: CashPaymentsRepository) {}

  async create(data: {
    tenantId: string; name: string; accountNumber: string; bankName: string;
    accountType: string; currency?: string;
  }) {
    return this.repo.createBankAccount(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findAllBankAccounts(tenantId);
  }

  async findById(id: string) {
    const account = await this.repo.findBankAccountById(id);
    if (!account) throw new NotFoundException('Bank account not found');
    return account;
  }

  async update(id: string, data: { name?: string; isActive?: boolean }) {
    const account = await this.repo.findBankAccountById(id);
    if (!account) throw new NotFoundException('Bank account not found');
    return this.repo.updateBankAccount(id, data);
  }

  async delete(id: string) {
    const account = await this.repo.findBankAccountById(id);
    if (!account) throw new NotFoundException('Bank account not found');
    await this.repo.deleteBankAccount(id);
  }
}

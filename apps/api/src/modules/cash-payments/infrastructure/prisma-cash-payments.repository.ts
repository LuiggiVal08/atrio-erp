import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CashPaymentsRepository } from '../domain/cash-payments.repository.interface';
import { CashRegister } from '../domain/cash-register.entity';
import { PaymentMethod } from '../domain/payment-method.entity';
import { CashMovement } from '../domain/cash-movement.entity';
import { BankAccount } from '../domain/bank-account.entity';

@Injectable()
export class PrismaCashPaymentsRepository implements CashPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRegister(data: { tenantId: string; name: string; location?: string; currency: string }): Promise<CashRegister> {
    const r = await this.prisma.cashRegister.create({ data });
    return new CashRegister(r.id, r.tenantId, r.name, r.location, r.balance, r.currency, r.isActive, r.createdAt, r.updatedAt);
  }

  async findAllRegisters(tenantId: string): Promise<CashRegister[]> {
    const records = await this.prisma.cashRegister.findMany({ where: { tenantId, isActive: true } });
    return records.map(r => new CashRegister(r.id, r.tenantId, r.name, r.location, r.balance, r.currency, r.isActive, r.createdAt, r.updatedAt));
  }

  async findRegisterById(id: string): Promise<CashRegister | null> {
    const r = await this.prisma.cashRegister.findUnique({ where: { id } });
    if (!r) return null;
    return new CashRegister(r.id, r.tenantId, r.name, r.location, r.balance, r.currency, r.isActive, r.createdAt, r.updatedAt);
  }

  async updateRegisterBalance(id: string, delta: number): Promise<CashRegister> {
    const r = await this.prisma.cashRegister.update({ where: { id }, data: { balance: { increment: delta } } });
    return new CashRegister(r.id, r.tenantId, r.name, r.location, r.balance, r.currency, r.isActive, r.createdAt, r.updatedAt);
  }

  async softDeleteRegister(id: string): Promise<void> {
    await this.prisma.cashRegister.update({ where: { id }, data: { isActive: false } });
  }

  async createPaymentMethod(data: { tenantId: string; name: string; type: string; currency?: string; commissionRate?: number }): Promise<PaymentMethod> {
    const r = await this.prisma.paymentMethod.create({ data: {
      tenantId: data.tenantId,
      name: data.name,
      type: data.type,
      currency: data.type === 'cash' ? (data.currency ?? '') : (data.currency ?? 'VED'),
      commissionRate: data.commissionRate,
    } });
    return new PaymentMethod(r.id, r.tenantId, r.name, r.type as any, r.currency, r.commissionRate, r.isActive, r.createdAt);
  }

  async findAllPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    const records = await this.prisma.paymentMethod.findMany({ where: { tenantId } });
    return records.map(r => new PaymentMethod(r.id, r.tenantId, r.name, r.type as any, r.currency, r.commissionRate, r.isActive, r.createdAt));
  }

  async updatePaymentMethod(
    id: string,
    tenantId: string,
    data: Partial<{ name: string; type: string; currency: string; commissionRate: number | null; isActive: boolean }>,
  ): Promise<PaymentMethod | null> {
    const updated = await this.prisma.paymentMethod.updateMany({
      where: { id, tenantId },
      data,
    });
    if (updated.count === 0) return null;

    const record = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!record) return null;
    return new PaymentMethod(
      record.id,
      record.tenantId,
      record.name,
      record.type as PaymentMethod['type'],
      record.currency,
      record.commissionRate,
      record.isActive,
      record.createdAt,
    );
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await this.prisma.paymentMethod.delete({ where: { id } });
  }

  async createMovement(data: { cashRegisterId: string; type: 'in' | 'out'; amount: number; currency?: string; exchangeRate?: number; baseAmount?: number; paymentMethod?: string; sessionId?: string; referenceType?: string; referenceId?: string; description?: string; userId: string; category?: string; receiptName?: string }): Promise<CashMovement> {
    const r = await this.prisma.cashMovement.create({
      data: {
        registerId: data.cashRegisterId, type: data.type, amount: data.amount,
        currency: data.currency ?? 'VED',
        exchangeRate: data.exchangeRate ?? 1,
        baseAmount: data.baseAmount ?? data.amount,
        paymentMethod: data.paymentMethod ?? 'cash', sessionId: data.sessionId ?? null,
        referenceType: data.referenceType ?? null, referenceId: data.referenceId ?? null,
        description: data.description ?? null, userId: data.userId,
        category: data.category ?? null, receiptName: data.receiptName ?? null,
      },
    });
    return new CashMovement(r.id, r.registerId, r.type as any, r.amount, r.referenceType, r.referenceId, r.description, r.createdAt, r.userId, r.currency, r.exchangeRate, r.baseAmount, r.paymentMethod, r.category, r.receiptName);
  }

  async findMovements(registerId: string): Promise<CashMovement[]> {
    const records = await this.prisma.cashMovement.findMany({ where: { registerId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => new CashMovement(r.id, r.registerId, r.type as any, r.amount, r.referenceType, r.referenceId, r.description, r.createdAt, r.userId, r.currency, r.exchangeRate, r.baseAmount, r.paymentMethod, r.category, r.receiptName));
  }

  // Bank Accounts
  async createBankAccount(data: { tenantId: string; name: string; accountNumber: string; bankName: string; accountType: string; currency?: string }): Promise<BankAccount> {
    const r = await this.prisma.bankAccount.create({ data: { ...data, currency: data.currency ?? 'VED' } });
    return new BankAccount(r.id, r.tenantId, r.name, r.accountNumber, r.bankName, r.accountType, r.currency, r.balance, r.isActive, r.createdAt, r.updatedAt);
  }

  async findAllBankAccounts(tenantId: string): Promise<BankAccount[]> {
    const records = await this.prisma.bankAccount.findMany({ where: { tenantId, isActive: true } });
    return records.map(r => new BankAccount(r.id, r.tenantId, r.name, r.accountNumber, r.bankName, r.accountType, r.currency, r.balance, r.isActive, r.createdAt, r.updatedAt));
  }

  async findBankAccountById(id: string): Promise<BankAccount | null> {
    const r = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!r) return null;
    return new BankAccount(r.id, r.tenantId, r.name, r.accountNumber, r.bankName, r.accountType, r.currency, r.balance, r.isActive, r.createdAt, r.updatedAt);
  }

  async updateBankAccount(id: string, data: Partial<{ name: string; isActive: boolean; balance: number }>): Promise<BankAccount> {
    const r = await this.prisma.bankAccount.update({ where: { id }, data });
    return new BankAccount(r.id, r.tenantId, r.name, r.accountNumber, r.bankName, r.accountType, r.currency, r.balance, r.isActive, r.createdAt, r.updatedAt);
  }

  async deleteBankAccount(id: string): Promise<void> {
    await this.prisma.bankAccount.update({ where: { id }, data: { isActive: false } });
  }
}

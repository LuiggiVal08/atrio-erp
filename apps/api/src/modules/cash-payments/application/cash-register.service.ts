import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CashPaymentsRepository } from '../domain/cash-payments.repository.interface';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class CashRegisterService {
  constructor(
    @Inject('CashPaymentsRepository') private readonly repo: CashPaymentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(data: { tenantId: string; name: string; location?: string; currency?: string }) {
    return this.repo.createRegister({ ...data, currency: data.currency ?? 'VED' });
  }

  async findAll(tenantId: string) {
    return this.repo.findAllRegisters(tenantId);
  }

  async softDelete(id: string) {
    return this.repo.softDeleteRegister(id);
  }

  async getDetail(id: string, tenantId: string) {
    const register = await this.prisma.cashRegister.findFirst({ where: { id, tenantId } });
    if (!register) throw new NotFoundException('Cash register not found');

    const session = await this.prisma.posSession.findFirst({
      where: { tenantId, cashRegisterId: id, status: 'open' },
      orderBy: { openedAt: 'desc' },
    });
    const previousClosing = session ? null : await this.prisma.posSession.findFirst({
      where: { tenantId, cashRegisterId: id, status: 'closed' },
      orderBy: { closedAt: 'desc' },
      select: { closedAt: true, closingDenominations: true },
    });
    const user = session
      ? await this.prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, name: true, email: true } })
      : null;
    const movements = await this.prisma.cashMovement.findMany({
      where: {
        registerId: id,
        ...(session ? {
          OR: [
            { sessionId: session.id },
            { sessionId: null, createdAt: { gte: session.openedAt } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let cashPayments = 0;
    let cashOut = 0;
    const paymentTotals = new Map<string, number>();
    const cashTotals = new Map<string, number>();
    const cashPaymentsByCurrency = new Map<string, number>();
    const cashOutByCurrency = new Map<string, number>();
    for (const movement of movements) {
      const method = movement.paymentMethod ?? 'cash';
      const currency = movement.currency ?? 'VED';
      if (method === 'cash') {
        const cashKey = `${currency}`;
        const baseAmount = movement.baseAmount ?? movement.amount;
        if (movement.type === 'in') {
          cashPayments += baseAmount;
          cashTotals.set(cashKey, (cashTotals.get(cashKey) ?? 0) + movement.amount);
          cashPaymentsByCurrency.set(cashKey, (cashPaymentsByCurrency.get(cashKey) ?? 0) + movement.amount);
        } else {
          cashOut += baseAmount;
          cashTotals.set(cashKey, (cashTotals.get(cashKey) ?? 0) - movement.amount);
          cashOutByCurrency.set(cashKey, (cashOutByCurrency.get(cashKey) ?? 0) + movement.amount);
        }
      } else {
        const key = `${method}:${currency}`;
        paymentTotals.set(key, (paymentTotals.get(key) ?? 0) + (movement.type === 'in' ? movement.amount : -movement.amount));
      }
    }

    const openingBalance = session?.openingBalance ?? 0;
    if (session && openingBalance > 0) {
      const openingCurrency = 'VES';
      cashTotals.set(openingCurrency, (cashTotals.get(openingCurrency) ?? 0) + openingBalance);
    }
    if (session && session.openingDenominations && typeof session.openingDenominations === 'object') {
      for (const [currency, denominations] of Object.entries(session.openingDenominations as Record<string, Record<string, number>>)) {
        if (currency === 'VES' || !denominations || typeof denominations !== 'object') continue;
        const amount = Object.entries(denominations).reduce(
          (sum, [denomination, quantity]) => sum + Number(denomination) * Number(quantity),
          0,
        );
        cashTotals.set(currency, (cashTotals.get(currency) ?? 0) + amount);
      }
    }
    return {
      register: {
        id: register.id,
        name: register.name,
        location: register.location,
        currency: register.currency,
        balance: register.balance,
        isActive: register.isActive,
      },
      session: session ? {
        id: session.id,
        status: session.status,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        openingBalance,
        closingBalance: session.closingBalance,
        openingDenominations: session.openingDenominations,
        user,
      } : null,
      previousClosing,
      totals: {
        openingBalance,
        cashPayments,
        cashOut,
        expectedCash: openingBalance + cashPayments - cashOut,
        currentBalance: register.balance,
        payments: Array.from(paymentTotals.entries()).map(([key, amount]) => {
          const separator = key.indexOf(':');
          return {
            method: key.slice(0, separator),
            currency: key.slice(separator + 1),
            amount,
          };
        }),
        cashByCurrency: Array.from(cashTotals.entries()).map(([currency, amount]) => ({ currency, amount })),
        cashPaymentsByCurrency: Array.from(cashPaymentsByCurrency.entries()).map(([currency, amount]) => ({ currency, amount })),
        cashOutByCurrency: Array.from(cashOutByCurrency.entries()).map(([currency, amount]) => ({ currency, amount })),
      },
      movements: movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        amount: movement.amount,
        currency: movement.currency ?? 'VED',
        exchangeRate: movement.exchangeRate ?? 1,
        baseAmount: movement.baseAmount ?? movement.amount,
        paymentMethod: movement.paymentMethod ?? 'cash',
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
        description: movement.description,
        category: movement.category,
        receiptName: movement.receiptName,
        createdAt: movement.createdAt,
        userId: movement.userId,
      })),
    };
  }
}

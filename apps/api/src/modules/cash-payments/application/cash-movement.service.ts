import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CashPaymentsRepository } from '../domain/cash-payments.repository.interface';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CashMovementService {
  constructor(
    @Inject('CashPaymentsRepository') private readonly repo: CashPaymentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async registerPayrollOutflow(
    data: {
      tenantId: string;
      cashRegisterId: string;
      payrollPeriodId: string;
      userId: string;
      payments: { currency: string; amount: number }[];
    },
    finalize?: (tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    if (data.payments.length === 0 || data.payments.some((payment) =>
      !Number.isFinite(payment.amount) || payment.amount <= 0 || !payment.currency.trim(),
    )) {
      throw new BadRequestException('Payroll payments must contain positive amounts and currencies');
    }

    const payments = Array.from(
      data.payments.reduce((totals, payment) => {
        const currency = payment.currency === 'VED' ? 'VES' : payment.currency.toUpperCase();
        totals.set(currency, (totals.get(currency) ?? 0) + payment.amount);
        return totals;
      }, new Map<string, number>()),
      ([currency, amount]) => ({ currency, amount: Math.round((amount + Number.EPSILON) * 100) / 100 }),
    );
    const idempotencyKeys = payments.map(({ currency }) => `${data.payrollPeriodId}:${currency}`);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.cashMovement.findMany({
        where: { idempotencyKey: { in: idempotencyKeys } },
      });
      if (existing.length > 0) {
        const matches = existing.length === payments.length && payments.every((payment) =>
          existing.some((movement) =>
            movement.registerId === data.cashRegisterId &&
            movement.referenceId === data.payrollPeriodId &&
            movement.currency === payment.currency &&
            Math.abs(movement.amount - payment.amount) < 0.005,
          ),
        );
        if (!matches) throw new BadRequestException('Payroll payout already exists with different details');
        await finalize?.(tx);
        return existing;
      }

      const register = await tx.cashRegister.findFirst({
        where: { id: data.cashRegisterId, tenantId: data.tenantId, isActive: true },
      });
      if (!register) throw new NotFoundException('Active cash register not found for this tenant');

      const session = await tx.posSession.findFirst({
        where: {
          tenantId: data.tenantId,
          cashRegisterId: data.cashRegisterId,
          userId: data.userId,
          status: 'open',
        },
        orderBy: { openedAt: 'desc' },
      });
      if (!session) throw new BadRequestException('Open this cash register before paying payroll');

      const tenant = await tx.tenant.findUnique({
        where: { id: data.tenantId },
        select: { baseCurrency: true },
      });
      if (!tenant) throw new NotFoundException('Tenant not found');
      const normalize = (currency: string) => currency === 'VED' ? 'VES' : currency.toUpperCase();
      const baseCurrency = normalize(tenant.baseCurrency || 'VES');
      const convertedPayments = [];

      for (const payment of payments) {
        let exchangeRate = 1;
        if (payment.currency !== baseCurrency) {
          const direct = await tx.currencyRate.findFirst({
            where: {
              tenantId: data.tenantId,
              fromCurrency: { in: payment.currency === 'VES' ? ['VES', 'VED'] : [payment.currency] },
              toCurrency: { in: baseCurrency === 'VES' ? ['VES', 'VED'] : [baseCurrency] },
            },
            orderBy: { date: 'desc' },
          });
          const inverse = direct ? null : await tx.currencyRate.findFirst({
            where: {
              tenantId: data.tenantId,
              fromCurrency: { in: baseCurrency === 'VES' ? ['VES', 'VED'] : [baseCurrency] },
              toCurrency: { in: payment.currency === 'VES' ? ['VES', 'VED'] : [payment.currency] },
            },
            orderBy: { date: 'desc' },
          });
          if (direct?.rate) exchangeRate = Number(direct.rate);
          else if (inverse?.rate) exchangeRate = 1 / Number(inverse.rate);
          else throw new BadRequestException(`No registered exchange rate for ${payment.currency} → ${baseCurrency}`);
        }
        convertedPayments.push({
          ...payment,
          exchangeRate,
          baseAmount: Math.round((payment.amount * exchangeRate + Number.EPSILON) * 100) / 100,
        });
      }

      const totalBaseAmount = convertedPayments.reduce((total, payment) => total + payment.baseAmount, 0);
      if (register.balance < totalBaseAmount) throw new BadRequestException('Insufficient cash register balance');
      const debited = await tx.cashRegister.updateMany({
        where: {
          id: register.id,
          tenantId: data.tenantId,
          isActive: true,
          balance: { gte: totalBaseAmount },
        },
        data: { balance: { decrement: totalBaseAmount } },
      });
      if (debited.count !== 1) throw new BadRequestException('Insufficient cash register balance');

      const movements = [];
      for (const payment of convertedPayments) {
        movements.push(await tx.cashMovement.create({
          data: {
            registerId: register.id,
            type: 'out',
            amount: payment.amount,
            currency: payment.currency,
            exchangeRate: payment.exchangeRate,
            baseAmount: payment.baseAmount,
            paymentMethod: 'cash',
            sessionId: session.id,
            referenceType: 'payroll-period',
            referenceId: data.payrollPeriodId,
            idempotencyKey: `${data.payrollPeriodId}:${payment.currency}`,
            category: 'payroll',
            description: `Payroll payout ${data.payrollPeriodId}`,
            userId: data.userId,
          },
        }));
      }
      await finalize?.(tx);
      return movements;
    }, { isolationLevel: 'Serializable' });
  }

  async registerPayrollBankOutflow(
    data: {
      tenantId: string;
      bankAccountId: string;
      payrollPeriodId: string;
      userId: string;
      payments: { currency: string; amount: number }[];
    },
    finalize?: (tx: Prisma.TransactionClient) => Promise<void>,
  ) {
    if (data.payments.length === 0 || data.payments.some((payment) =>
      !Number.isFinite(payment.amount) || payment.amount <= 0 || !payment.currency.trim(),
    )) {
      throw new BadRequestException('Payroll payments must contain positive amounts and currencies');
    }

    const normalize = (currency: string) => currency === 'VED' ? 'VES' : currency.toUpperCase();
    const payments = Array.from(
      data.payments.reduce((totals, payment) => {
        const currency = normalize(payment.currency);
        totals.set(currency, (totals.get(currency) ?? 0) + payment.amount);
        return totals;
      }, new Map<string, number>()),
      ([currency, amount]) => ({ currency, amount: Math.round((amount + Number.EPSILON) * 100) / 100 }),
    );
    const idempotencyKeys = payments.map(({ currency }) =>
      `${data.payrollPeriodId}:${data.bankAccountId}:${currency}`,
    );

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.bankMovement.findMany({
        where: { idempotencyKey: { in: idempotencyKeys } },
      });
      if (existing.length > 0) {
        const matches = existing.length === payments.length && payments.every((payment) =>
          existing.some((movement) =>
            movement.bankAccountId === data.bankAccountId &&
            movement.referenceId === data.payrollPeriodId &&
            movement.currency === payment.currency &&
            Math.abs(Number(movement.amount) - payment.amount) < 0.005,
          ),
        );
        if (!matches) throw new BadRequestException('Payroll bank payout already exists with different details');
        await finalize?.(tx);
        return existing;
      }

      const account = await tx.bankAccount.findFirst({
        where: { id: data.bankAccountId, tenantId: data.tenantId, isActive: true },
      });
      if (!account) throw new NotFoundException('Active bank account not found for this tenant');

      const accountCurrency = normalize(account.currency);
      const convertedPayments = [];
      for (const payment of payments) {
        let exchangeRate = 1;
        if (payment.currency !== accountCurrency) {
          const direct = await tx.currencyRate.findFirst({
            where: {
              tenantId: data.tenantId,
              fromCurrency: { in: payment.currency === 'VES' ? ['VES', 'VED'] : [payment.currency] },
              toCurrency: { in: accountCurrency === 'VES' ? ['VES', 'VED'] : [accountCurrency] },
            },
            orderBy: { date: 'desc' },
          });
          const inverse = direct ? null : await tx.currencyRate.findFirst({
            where: {
              tenantId: data.tenantId,
              fromCurrency: { in: accountCurrency === 'VES' ? ['VES', 'VED'] : [accountCurrency] },
              toCurrency: { in: payment.currency === 'VES' ? ['VES', 'VED'] : [payment.currency] },
            },
            orderBy: { date: 'desc' },
          });
          if (direct?.rate) exchangeRate = Number(direct.rate);
          else if (inverse?.rate) exchangeRate = 1 / Number(inverse.rate);
          else throw new BadRequestException(`No registered exchange rate for ${payment.currency} → ${accountCurrency}`);
        }
        convertedPayments.push({
          ...payment,
          exchangeRate,
          accountAmount: Math.round((payment.amount * exchangeRate + Number.EPSILON) * 100) / 100,
        });
      }

      const totalAccountAmount = convertedPayments.reduce((total, payment) => total + payment.accountAmount, 0);
      const debited = await tx.bankAccount.updateMany({
        where: {
          id: account.id,
          tenantId: data.tenantId,
          isActive: true,
          balance: { gte: totalAccountAmount },
        },
        data: { balance: { decrement: totalAccountAmount } },
      });
      if (debited.count !== 1) throw new BadRequestException('Insufficient bank account balance');

      const movements = [];
      for (const payment of convertedPayments) {
        movements.push(await tx.bankMovement.create({
          data: {
            tenantId: data.tenantId,
            bankAccountId: account.id,
            type: 'out',
            amount: payment.amount,
            currency: payment.currency,
            exchangeRate: payment.exchangeRate,
            accountAmount: payment.accountAmount,
            referenceType: 'payroll-period',
            referenceId: data.payrollPeriodId,
            idempotencyKey: `${data.payrollPeriodId}:${data.bankAccountId}:${payment.currency}`,
            description: `Payroll payout ${data.payrollPeriodId}`,
            userId: data.userId,
          },
        }));
      }
      await finalize?.(tx);
      return movements;
    }, { isolationLevel: 'Serializable' });
  }

  async register(data: {
    tenantId: string; cashRegisterId: string; type: 'in' | 'out'; amount: number;
    currency?: string; exchangeRate?: number;
    referenceType?: string; referenceId?: string; description?: string; userId: string;
    category?: string; receiptName?: string;
  }) {
    if (data.amount <= 0) throw new BadRequestException('Amount must be positive');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: data.tenantId }, select: { baseCurrency: true } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const normalize = (currency: string) => currency === 'VED' ? 'VES' : currency.toUpperCase();
    const currency = normalize(data.currency ?? 'VES');
    const baseCurrency = normalize(tenant.baseCurrency || 'VES');
    let resolvedExchangeRate = 1;

    if (currency !== baseCurrency) {
      const direct = await this.prisma.currencyRate.findFirst({
        where: {
          tenantId: data.tenantId,
          fromCurrency: { in: currency === 'VES' ? ['VES', 'VED'] : [currency] },
          toCurrency: { in: baseCurrency === 'VES' ? ['VES', 'VED'] : [baseCurrency] },
        },
        orderBy: { date: 'desc' },
      });
      const inverse = direct ? null : await this.prisma.currencyRate.findFirst({
        where: {
          tenantId: data.tenantId,
          fromCurrency: { in: baseCurrency === 'VES' ? ['VES', 'VED'] : [baseCurrency] },
          toCurrency: { in: currency === 'VES' ? ['VES', 'VED'] : [currency] },
        },
        orderBy: { date: 'desc' },
      });
      if (direct?.rate) resolvedExchangeRate = direct.rate;
      else if (inverse?.rate) resolvedExchangeRate = 1 / inverse.rate;
      else throw new BadRequestException(`No registered exchange rate for ${currency} → ${baseCurrency}`);
    }

    const baseAmount = data.amount * resolvedExchangeRate;
    const session = await this.prisma.posSession.findFirst({
      where: {
        tenantId: data.tenantId,
        cashRegisterId: data.cashRegisterId,
        status: 'open',
      },
      orderBy: { openedAt: 'desc' },
    });
    if (!session) throw new BadRequestException('The register must be open before recording movements');
    if (session.userId !== data.userId) {
      throw new BadRequestException('Only the user who opened the register can record movements');
    }

    if (data.type === 'out') {
      const register = await this.repo.findRegisterById(data.cashRegisterId);
      if (!register) throw new NotFoundException('Cash register not found');
      if (register.balance < baseAmount) throw new BadRequestException('Insufficient balance');
    }

    const delta = data.type === 'in' ? baseAmount : -baseAmount;
    await this.repo.updateRegisterBalance(data.cashRegisterId, delta);
    return this.repo.createMovement({
      ...data,
      paymentMethod: 'cash',
      sessionId: session?.id,
      currency: data.currency ?? 'VED',
      exchangeRate: resolvedExchangeRate,
      baseAmount,
    });
  }

  async getMovements(cashRegisterId: string) {
    return this.repo.findMovements(cashRegisterId);
  }
}

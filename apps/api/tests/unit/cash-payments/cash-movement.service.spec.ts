import { CashMovementService } from '../../../src/modules/cash-payments/application/cash-movement.service';
import { CashPaymentsRepository } from '../../../src/modules/cash-payments/domain/cash-payments.repository.interface';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('CashMovementService', () => {
  let service: CashMovementService;
  const mockPrisma = {
    tenant: { findUnique: jest.fn().mockResolvedValue({ baseCurrency: 'VED' }) },
    currencyRate: { findFirst: jest.fn().mockResolvedValue(null) },
    posSession: { findFirst: jest.fn().mockResolvedValue({ id: 'session-1', userId: 'user-1' }) },
  } as unknown as PrismaService;
  const mockRepo: CashPaymentsRepository = {
    createRegister: jest.fn(),
    findAllRegisters: jest.fn(),
    findRegisterById: jest.fn(),
    updateRegisterBalance: jest.fn(),
    softDeleteRegister: jest.fn(),
    createPaymentMethod: jest.fn(),
    findAllPaymentMethods: jest.fn(),
    updatePaymentMethod: jest.fn(),
    deletePaymentMethod: jest.fn(),
    createMovement: jest.fn(),
    findMovements: jest.fn(),
    createBankAccount: jest.fn(),
    findAllBankAccounts: jest.fn(),
    findBankAccountById: jest.fn(),
    updateBankAccount: jest.fn(),
    deleteBankAccount: jest.fn(),
  };

  beforeEach(() => {
    service = new CashMovementService(mockRepo, mockPrisma);
    jest.clearAllMocks();
  });

  it('should register an incoming movement', async () => {
    (mockRepo.findRegisterById as jest.Mock).mockResolvedValue({ id: 'reg-1', balance: 0 });
    (mockRepo.updateRegisterBalance as jest.Mock).mockResolvedValue({});
    (mockRepo.createMovement as jest.Mock).mockResolvedValue({ id: 'mov-1', type: 'in', amount: 500 });
    const result = await service.register({ tenantId: 'tenant-1', cashRegisterId: 'reg-1', type: 'in', amount: 500, userId: 'user-1' });
    expect(result).toHaveProperty('id', 'mov-1');
  });

  it('should reject outgoing movement with insufficient balance', async () => {
    (mockRepo.findRegisterById as jest.Mock).mockResolvedValue({ id: 'reg-1', balance: 100 });
    await expect(service.register({ tenantId: 'tenant-1', cashRegisterId: 'reg-1', type: 'out', amount: 200, userId: 'user-1' })).rejects.toThrow('Insufficient balance');
  });

  it('should reject zero or negative amount', async () => {
    await expect(service.register({ tenantId: 'tenant-1', cashRegisterId: 'reg-1', type: 'in', amount: 0, userId: 'user-1' })).rejects.toThrow('Amount must be positive');
  });

  it('should reject movement for non-existent register', async () => {
    (mockRepo.findRegisterById as jest.Mock).mockResolvedValue(null);
    await expect(service.register({ tenantId: 'tenant-1', cashRegisterId: 'missing', type: 'out', amount: 50, userId: 'user-1' })).rejects.toThrow('Cash register not found');
  });

  it('should register outgoing movement with sufficient balance', async () => {
    (mockRepo.findRegisterById as jest.Mock).mockResolvedValue({ id: 'reg-1', balance: 500 });
    (mockRepo.updateRegisterBalance as jest.Mock).mockResolvedValue({});
    (mockRepo.createMovement as jest.Mock).mockResolvedValue({ id: 'mov-2', type: 'out', amount: 300 });
    const result = await service.register({ tenantId: 'tenant-1', cashRegisterId: 'reg-1', type: 'out', amount: 300, userId: 'user-1' });
    expect(result).toHaveProperty('id', 'mov-2');
  });

  it('records payroll bank outflows and finalizes payroll in the same transaction', async () => {
    const tx = {
      bankMovement: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'bank-movement-1' }),
      },
      bankAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'bank-1',
          currency: 'USD',
          balance: 500,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      currencyRate: { findFirst: jest.fn() },
    };
    const transactionRunner = jest.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
      callback(tx),
    );
    const prisma = { $transaction: transactionRunner } as unknown as PrismaService;
    const bankService = new CashMovementService(mockRepo, prisma);
    const finalize = jest.fn().mockResolvedValue(undefined);

    await bankService.registerPayrollBankOutflow({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      payrollPeriodId: 'period-1',
      userId: 'user-1',
      payments: [{ currency: 'USD', amount: 125 }],
    }, finalize);

    expect(tx.bankAccount.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ balance: { gte: 125 } }),
      data: { balance: { decrement: 125 } },
    }));
    expect(tx.bankMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bankAccountId: 'bank-1',
        type: 'out',
        amount: 125,
        currency: 'USD',
        referenceId: 'period-1',
        idempotencyKey: 'period-1:bank-1:USD',
      }),
    });
    expect(finalize).toHaveBeenCalledWith(tx);
  });
});

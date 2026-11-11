import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { CashRegisterService } from '../../../src/modules/cash-payments/application/cash-register.service';
import { CashPaymentsRepository } from '../../../src/modules/cash-payments/domain/cash-payments.repository.interface';

describe('CashRegisterService', () => {
  let service: CashRegisterService;
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

  const mockPrisma = {
    cashRegister: { findFirst: jest.fn() },
    posSession: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    cashMovement: { findMany: jest.fn() },
  };

  beforeEach(() => {
    service = new CashRegisterService(mockRepo, mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  it('should create a register', async () => {
    (mockRepo.createRegister as jest.Mock).mockResolvedValue({ id: 'reg-1', name: 'Caja Principal', balance: 0, currency: 'VED' });
    const result = await service.create({ tenantId: 't1', name: 'Caja Principal', currency: 'VED' });
    expect(result).toHaveProperty('id', 'reg-1');
  });

  it('should list registers', async () => {
    (mockRepo.findAllRegisters as jest.Mock).mockResolvedValue([{ id: 'reg-1' }]);
    const result = await service.findAll('t1');
    expect(result).toHaveLength(1);
  });
});

import { CashMovementService } from '../../../src/modules/cash-payments/application/cash-movement.service';
import { CashPaymentsRepository } from '../../../src/modules/cash-payments/domain/cash-payments.repository.interface';

describe('CashMovementService', () => {
  let service: CashMovementService;
  const mockRepo: CashPaymentsRepository = {
    createRegister: jest.fn(),
    findAllRegisters: jest.fn(),
    findRegisterById: jest.fn(),
    updateRegisterBalance: jest.fn(),
    softDeleteRegister: jest.fn(),
    createPaymentMethod: jest.fn(),
    findAllPaymentMethods: jest.fn(),
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
    service = new CashMovementService(mockRepo);
    jest.clearAllMocks();
  });

  it('should register an incoming movement', async () => {
    (mockRepo.findRegisterById as jest.Mock).mockResolvedValue({ id: 'reg-1', balance: 0 });
    (mockRepo.updateRegisterBalance as jest.Mock).mockResolvedValue({});
    (mockRepo.createMovement as jest.Mock).mockResolvedValue({ id: 'mov-1', type: 'in', amount: 500 });
    const result = await service.register({ cashRegisterId: 'reg-1', type: 'in', amount: 500, userId: 'user-1' });
    expect(result).toHaveProperty('id', 'mov-1');
  });

  it('should reject outgoing movement with insufficient balance', async () => {
    (mockRepo.findRegisterById as jest.Mock).mockResolvedValue({ id: 'reg-1', balance: 100 });
    await expect(service.register({ cashRegisterId: 'reg-1', type: 'out', amount: 200, userId: 'user-1' })).rejects.toThrow('Insufficient balance');
  });

  it('should reject zero or negative amount', async () => {
    await expect(service.register({ cashRegisterId: 'reg-1', type: 'in', amount: 0, userId: 'user-1' })).rejects.toThrow('Amount must be positive');
  });

  it('should reject movement for non-existent register', async () => {
    (mockRepo.findRegisterById as jest.Mock).mockResolvedValue(null);
    await expect(service.register({ cashRegisterId: 'missing', type: 'out', amount: 50, userId: 'user-1' })).rejects.toThrow('Cash register not found');
  });

  it('should register outgoing movement with sufficient balance', async () => {
    (mockRepo.findRegisterById as jest.Mock).mockResolvedValue({ id: 'reg-1', balance: 500 });
    (mockRepo.updateRegisterBalance as jest.Mock).mockResolvedValue({});
    (mockRepo.createMovement as jest.Mock).mockResolvedValue({ id: 'mov-2', type: 'out', amount: 300 });
    const result = await service.register({ cashRegisterId: 'reg-1', type: 'out', amount: 300, userId: 'user-1' });
    expect(result).toHaveProperty('id', 'mov-2');
  });
});

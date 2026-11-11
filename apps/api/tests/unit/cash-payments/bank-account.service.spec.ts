import { BankAccountService } from '../../../src/modules/cash-payments/application/bank-account.service';
import { CashPaymentsRepository } from '../../../src/modules/cash-payments/domain/cash-payments.repository.interface';

describe('BankAccountService', () => {
  let service: BankAccountService;
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
    service = new BankAccountService(mockRepo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a bank account', async () => {
      (mockRepo.createBankAccount as jest.Mock).mockResolvedValue({
        id: 'ba-1', name: 'Main Account', accountNumber: '12345',
        bankName: 'Test Bank', accountType: 'checking', isActive: true,
      });
      const dto = { tenantId: 't1', name: 'Main Account', accountNumber: '12345', bankName: 'Test Bank', accountType: 'checking' };
      const result = await service.create(dto);
      expect(result).toHaveProperty('name', 'Main Account');
      expect(mockRepo.createBankAccount).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all active accounts for tenant', async () => {
      (mockRepo.findAllBankAccounts as jest.Mock).mockResolvedValue([{ id: 'ba-1', name: 'Main Account' }]);
      const result = await service.findAll('t1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return account by id', async () => {
      (mockRepo.findBankAccountById as jest.Mock).mockResolvedValue({ id: 'ba-1' });
      const result = await service.findById('ba-1');
      expect(result).toHaveProperty('id', 'ba-1');
    });

    it('should throw when not found', async () => {
      (mockRepo.findBankAccountById as jest.Mock).mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow('Bank account not found');
    });
  });

  describe('update', () => {
    it('should update a bank account', async () => {
      (mockRepo.findBankAccountById as jest.Mock).mockResolvedValue({ id: 'ba-1' });
      (mockRepo.updateBankAccount as jest.Mock).mockResolvedValue({ id: 'ba-1', name: 'Updated Account' });
      const result = await service.update('ba-1', { name: 'Updated Account' });
      expect(result).toHaveProperty('name', 'Updated Account');
    });

    it('should throw when not found', async () => {
      (mockRepo.findBankAccountById as jest.Mock).mockResolvedValue(null);
      await expect(service.update('missing', { name: 'X' })).rejects.toThrow('Bank account not found');
    });
  });

  describe('delete', () => {
    it('should soft-delete a bank account', async () => {
      (mockRepo.findBankAccountById as jest.Mock).mockResolvedValue({ id: 'ba-1' });
      (mockRepo.deleteBankAccount as jest.Mock).mockResolvedValue(undefined);
      await service.delete('ba-1');
      expect(mockRepo.deleteBankAccount).toHaveBeenCalledWith('ba-1');
    });

    it('should throw when not found', async () => {
      (mockRepo.findBankAccountById as jest.Mock).mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow('Bank account not found');
    });
  });
});

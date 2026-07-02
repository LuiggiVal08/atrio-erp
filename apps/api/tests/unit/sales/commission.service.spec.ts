import { CommissionService } from '../../../src/modules/sales/application/commission.service';
import { CommissionRepository } from '../../../src/modules/sales/domain/commission.repository.interface';
import { SalesRepository } from '../../../src/modules/sales/domain/sales.repository.interface';

describe('CommissionService', () => {
  let service: CommissionService;
  const mockCommissionRepo: CommissionRepository = {
    create: jest.fn(),
    findByTenant: jest.fn(),
    findById: jest.fn(),
    findBySalesperson: jest.fn(),
    updateStatus: jest.fn(),
    getSummary: jest.fn(),
  };
  const mockSalesRepo: SalesRepository = {
    createOrder: jest.fn(),
    findOrdersByTenant: jest.fn(),
    findOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
    createInvoice: jest.fn(),
    findInvoicesByTenant: jest.fn(),
    findInvoiceById: jest.fn(),
    updateInvoiceStatus: jest.fn(),
    updateInvoice: jest.fn(),
    deleteInvoice: jest.fn(),
    payInvoice: jest.fn(),
  };

  beforeEach(() => {
    service = new CommissionService(mockCommissionRepo, mockSalesRepo);
    jest.clearAllMocks();
  });

  describe('createFromInvoice', () => {
    it('should create a commission when invoice has salespersonId', async () => {
      (mockSalesRepo.findInvoiceById as jest.Mock).mockResolvedValue({
        id: 'inv-1', tenantId: 't1', total: 1000, currency: 'VED',
        salespersonId: 'sp-1', commissionRate: 0.05,
      });
      (mockCommissionRepo.create as jest.Mock).mockResolvedValue({ id: 'comm-1' });

      await service.createFromInvoice('inv-1');

      expect(mockCommissionRepo.create).toHaveBeenCalledWith({
        tenantId: 't1', invoiceId: 'inv-1', salespersonId: 'sp-1',
        invoiceTotal: 1000, commissionRate: 0.05, commissionAmount: 50,
        currency: 'VED',
      });
    });

    it('should use default 5% rate when commissionRate not set', async () => {
      (mockSalesRepo.findInvoiceById as jest.Mock).mockResolvedValue({
        id: 'inv-1', tenantId: 't1', total: 2000, currency: 'VED',
        salespersonId: 'sp-1', commissionRate: null,
      });
      (mockCommissionRepo.create as jest.Mock).mockResolvedValue({ id: 'comm-1' });

      await service.createFromInvoice('inv-1');

      expect(mockCommissionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ commissionRate: 0.05, commissionAmount: 100 }),
      );
    });

    it('should do nothing when invoice has no salespersonId', async () => {
      (mockSalesRepo.findInvoiceById as jest.Mock).mockResolvedValue({
        id: 'inv-1', salespersonId: null,
      });

      await service.createFromInvoice('inv-1');

      expect(mockCommissionRepo.create).not.toHaveBeenCalled();
    });

    it('should throw when invoice not found', async () => {
      (mockSalesRepo.findInvoiceById as jest.Mock).mockResolvedValue(null);

      await expect(service.createFromInvoice('missing')).rejects.toThrow('Sales invoice not found');
    });
  });

  describe('findAll', () => {
    it('should return all commissions for tenant', async () => {
      (mockCommissionRepo.findByTenant as jest.Mock).mockResolvedValue([{ id: 'comm-1' }]);
      const result = await service.findAll('t1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return commission by id', async () => {
      (mockCommissionRepo.findById as jest.Mock).mockResolvedValue({ id: 'comm-1' });
      const result = await service.findById('comm-1');
      expect(result).toHaveProperty('id', 'comm-1');
    });

    it('should throw when commission not found', async () => {
      (mockCommissionRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow('Commission not found');
    });
  });

  describe('findBySalesperson', () => {
    it('should return commissions for a salesperson', async () => {
      (mockCommissionRepo.findBySalesperson as jest.Mock).mockResolvedValue([{ id: 'comm-1', salespersonId: 'sp-1' }]);
      const result = await service.findBySalesperson('t1', 'sp-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('pay', () => {
    it('should mark commission as paid', async () => {
      (mockCommissionRepo.findById as jest.Mock).mockResolvedValue({ id: 'comm-1', status: 'pending' });
      (mockCommissionRepo.updateStatus as jest.Mock).mockResolvedValue({ id: 'comm-1', status: 'paid' });

      const result = await service.pay('comm-1');

      expect(result).toHaveProperty('status', 'paid');
      expect(mockCommissionRepo.updateStatus).toHaveBeenCalledWith('comm-1', 'paid', expect.any(Date));
    });

    it('should throw if already paid', async () => {
      (mockCommissionRepo.findById as jest.Mock).mockResolvedValue({ id: 'comm-1', status: 'paid' });
      await expect(service.pay('comm-1')).rejects.toThrow('Commission is already paid');
    });

    it('should throw if cancelled', async () => {
      (mockCommissionRepo.findById as jest.Mock).mockResolvedValue({ id: 'comm-1', status: 'cancelled' });
      await expect(service.pay('comm-1')).rejects.toThrow('Cannot pay a cancelled commission');
    });

    it('should throw if not found', async () => {
      (mockCommissionRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.pay('missing')).rejects.toThrow('Commission not found');
    });
  });

  describe('cancel', () => {
    it('should mark commission as cancelled', async () => {
      (mockCommissionRepo.findById as jest.Mock).mockResolvedValue({ id: 'comm-1', status: 'pending' });
      (mockCommissionRepo.updateStatus as jest.Mock).mockResolvedValue({ id: 'comm-1', status: 'cancelled' });

      const result = await service.cancel('comm-1');

      expect(result).toHaveProperty('status', 'cancelled');
    });

    it('should throw if commission is paid', async () => {
      (mockCommissionRepo.findById as jest.Mock).mockResolvedValue({ id: 'comm-1', status: 'paid' });
      await expect(service.cancel('comm-1')).rejects.toThrow('Cannot cancel a paid commission');
    });

    it('should throw if not found', async () => {
      (mockCommissionRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.cancel('missing')).rejects.toThrow('Commission not found');
    });
  });

  describe('getSummary', () => {
    it('should return summary counts', async () => {
      (mockCommissionRepo.getSummary as jest.Mock).mockResolvedValue({ pending: 5, paid: 3, total: 8 });
      const result = await service.getSummary('t1');
      expect(result).toEqual({ pending: 5, paid: 3, total: 8 });
    });
  });
});

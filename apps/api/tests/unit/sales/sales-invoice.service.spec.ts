import { SalesInvoiceService } from '../../../src/modules/sales/application/sales-invoice.service';
import { SalesRepository } from '../../../src/modules/sales/domain/sales.repository.interface';

const mockCommissionService = { createFromInvoice: jest.fn() };

describe('SalesInvoiceService', () => {
  let service: SalesInvoiceService;
  const mockRepo: SalesRepository = {
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
    service = new SalesInvoiceService(mockRepo, mockCommissionService as any);
    jest.clearAllMocks();
  });

  it('should create an invoice', async () => {
    (mockRepo.createInvoice as jest.Mock).mockResolvedValue({ id: 'inv-1', status: 'pending' });
    const result = await service.create({ tenantId: 't1', documentId: 'doc-2', clientId: 'c1', subtotal: 862, taxAmount: 138, total: 1000, currency: 'VED' });
    expect(result).toHaveProperty('id', 'inv-1');
  });

  it('should list invoices', async () => {
    (mockRepo.findInvoicesByTenant as jest.Mock).mockResolvedValue([{ id: 'inv-1' }]);
    const result = await service.findAll('t1');
    expect(result).toHaveLength(1);
  });

  it('should throw when invoice not found', async () => {
    (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow('Sales invoice not found');
  });

  it('should approve pending invoice', async () => {
    (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue({ id: 'inv-1', status: 'pending' });
    (mockRepo.updateInvoiceStatus as jest.Mock).mockResolvedValue({ id: 'inv-1', status: 'approved' });
    const result = await service.approve('inv-1');
    expect(result).toHaveProperty('status', 'approved');
  });

  it('should throw when approving non-pending invoice', async () => {
    (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue({ id: 'inv-1', status: 'approved' });
    await expect(service.approve('inv-1')).rejects.toThrow('Only pending invoices can be approved');
  });

  describe('update', () => {
    it('should update an existing invoice', async () => {
      (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue({ id: 'inv-1', total: 1000 });
      (mockRepo.updateInvoice as jest.Mock).mockResolvedValue({ id: 'inv-1', total: 1200 });
      const result = await service.update('inv-1', { total: 1200 });
      expect(result).toHaveProperty('total', 1200);
    });

    it('should throw if invoice not found', async () => {
      (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue(null);
      await expect(service.update('missing', { total: 100 })).rejects.toThrow('Sales invoice not found');
    });
  });

  describe('delete', () => {
    it('should delete an existing invoice', async () => {
      (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue({ id: 'inv-1' });
      await service.delete('inv-1');
      expect(mockRepo.deleteInvoice).toHaveBeenCalledWith('inv-1');
    });

    it('should throw if invoice not found', async () => {
      (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow('Sales invoice not found');
    });
  });

  describe('pay', () => {
    it('should pay a pending invoice and create commission', async () => {
      (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue({ id: 'inv-1', status: 'pending' });
      (mockRepo.payInvoice as jest.Mock).mockResolvedValue({ id: 'inv-1', status: 'paid' });
      const result = await service.pay('inv-1', 'pm-1');
      expect(result).toHaveProperty('status', 'paid');
      expect(mockRepo.payInvoice).toHaveBeenCalledWith('inv-1', 'pm-1');
      expect(mockCommissionService.createFromInvoice).toHaveBeenCalledWith('inv-1');
    });

    it('should throw if already paid', async () => {
      (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue({ id: 'inv-1', status: 'paid' });
      await expect(service.pay('inv-1', 'pm-1')).rejects.toThrow('Invoice is already paid');
    });

    it('should throw if cancelled', async () => {
      (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue({ id: 'inv-1', status: 'cancelled' });
      await expect(service.pay('inv-1', 'pm-1')).rejects.toThrow('Cannot pay a cancelled invoice');
    });

    it('should throw if invoice not found', async () => {
      (mockRepo.findInvoiceById as jest.Mock).mockResolvedValue(null);
      await expect(service.pay('missing', 'pm-1')).rejects.toThrow('Sales invoice not found');
    });
  });
});

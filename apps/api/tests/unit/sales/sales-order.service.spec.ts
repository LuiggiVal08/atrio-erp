import { SalesOrderService } from '../../../src/modules/sales/application/sales-order.service';
import { SalesRepository } from '../../../src/modules/sales/domain/sales.repository.interface';

describe('SalesOrderService', () => {
  let service: SalesOrderService;
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
    service = new SalesOrderService(mockRepo);
    jest.clearAllMocks();
  });

  it('should create an order', async () => {
    (mockRepo.createOrder as jest.Mock).mockResolvedValue({ id: 'ord-1', total: 1000 });
    const result = await service.create({ tenantId: 't1', documentId: 'doc-1', clientId: 'c1', subtotal: 862, taxAmount: 138, total: 1000, currency: 'VED' });
    expect(result).toHaveProperty('id', 'ord-1');
  });

  it('should reject negative total', async () => {
    await expect(service.create({ tenantId: 't1', documentId: 'doc-1', clientId: 'c1', subtotal: 0, taxAmount: 0, total: -1, currency: 'VED' })).rejects.toThrow('Total must be >= 0');
  });

  it('should list orders', async () => {
    (mockRepo.findOrdersByTenant as jest.Mock).mockResolvedValue([{ id: 'ord-1' }]);
    const result = await service.findAll('t1');
    expect(result).toHaveLength(1);
  });

  it('should throw when order not found', async () => {
    (mockRepo.findOrderById as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow('Sales order not found');
  });

  describe('update', () => {
    it('should update an existing order', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'ord-1', total: 1000 });
      (mockRepo.updateOrder as jest.Mock).mockResolvedValue({ id: 'ord-1', total: 1500 });
      const result = await service.update('ord-1', { total: 1500 });
      expect(result).toHaveProperty('total', 1500);
    });

    it('should throw if order not found', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue(null);
      await expect(service.update('missing', { total: 100 })).rejects.toThrow('Sales order not found');
    });

    it('should reject negative total on update', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'ord-1', total: 1000 });
      await expect(service.update('ord-1', { total: -1 })).rejects.toThrow('Total must be >= 0');
    });
  });

  describe('delete', () => {
    it('should delete an existing order', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'ord-1' });
      await service.delete('ord-1');
      expect(mockRepo.deleteOrder).toHaveBeenCalledWith('ord-1');
    });

    it('should throw if order not found', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow('Sales order not found');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'ord-1', status: 'draft' });
      (mockRepo.updateOrderStatus as jest.Mock).mockResolvedValue({ id: 'ord-1', status: 'approved' });
      const result = await service.updateStatus('ord-1', 'approved');
      expect(result).toHaveProperty('status', 'approved');
    });

    it('should throw if order not found', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue(null);
      await expect(service.updateStatus('missing', 'approved')).rejects.toThrow('Sales order not found');
    });
  });
});

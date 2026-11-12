import { PurchaseOrderService } from '../../../src/modules/purchasing/application/purchase-order.service';
import { PurchasingRepository } from '../../../src/modules/purchasing/domain/purchasing.repository.interface';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;
  const mockRepo: PurchasingRepository = {
    createOrder: jest.fn(),
    findOrdersByTenant: jest.fn(),
    findOrderById: jest.fn(),
    findVendorDeliveryDays: jest.fn(),
    updateOrderStatus: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
    createReturn: jest.fn(),
    findReturnsByOrder: jest.fn(),
    findReturnsByTenant: jest.fn(),
    findReturnById: jest.fn(),
    updateReturnStatus: jest.fn(),
    deleteReturn: jest.fn(),
    findOrderLines: jest.fn(),
    updateLineReceivedQuantity: jest.fn(),
  };
  const mockEventEmitter = { emit: jest.fn() };
  const mockCreateDocument = { execute: jest.fn() };

  beforeEach(() => {
    service = new PurchaseOrderService(mockRepo, mockEventEmitter as any, mockCreateDocument as any);
    jest.clearAllMocks();
    (mockRepo.findVendorDeliveryDays as jest.Mock).mockResolvedValue(null);
    mockCreateDocument.execute.mockResolvedValue({ id: 'doc-new' });
  });

  const dateIn = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  it('should create an order', async () => {
    (mockRepo.createOrder as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'pending' });
    const result = await service.create({ tenantId: 't1', createdById: 'u1', documentId: 'doc-1', vendorId: 'v1', subtotal: 800, taxAmount: 200, total: 1000, currency: 'VED' });
    expect(result).toHaveProperty('id', 'po-1');
  });

  it('creates a purchase document when no documentId is provided', async () => {
    (mockRepo.createOrder as jest.Mock).mockResolvedValue({ id: 'po-1' });

    await service.create({ tenantId: 't1', createdById: 'u1', vendorId: 'v1', subtotal: 800, taxAmount: 200, total: 1000, currency: 'VED' });

    expect(mockCreateDocument.execute).toHaveBeenCalledWith(
      expect.objectContaining({ documentType: 'purchase_order' }),
      { tenantId: 't1', userId: 'u1' },
    );
    expect(mockRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({ documentId: 'doc-new' }));
  });

  describe('expected date', () => {
    const baseInput = { tenantId: 't1', createdById: 'u1', vendorId: 'v1', subtotal: 800, taxAmount: 200, total: 1000, currency: 'VED' };

    it('auto-fills from the vendor delivery days when omitted', async () => {
      (mockRepo.findVendorDeliveryDays as jest.Mock).mockResolvedValue(5);
      (mockRepo.createOrder as jest.Mock).mockResolvedValue({ id: 'po-1' });

      await service.create(baseInput);

      expect(mockRepo.findVendorDeliveryDays).toHaveBeenCalledWith('t1', 'v1');
      expect(mockRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({ expectedDate: dateIn(5) }));
    });

    it('keeps an explicit expected date and skips the vendor lookup', async () => {
      (mockRepo.createOrder as jest.Mock).mockResolvedValue({ id: 'po-1' });

      await service.create({ ...baseInput, expectedDate: '2030-01-15' });

      expect(mockRepo.findVendorDeliveryDays).not.toHaveBeenCalled();
      expect(mockRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({ expectedDate: '2030-01-15' }));
    });

    it('leaves the expected date empty when the vendor has no delivery days', async () => {
      (mockRepo.createOrder as jest.Mock).mockResolvedValue({ id: 'po-1' });

      await service.create(baseInput);

      expect(mockRepo.createOrder).toHaveBeenCalledWith(expect.objectContaining({ expectedDate: undefined }));
    });
  });

  it('should list orders', async () => {
    (mockRepo.findOrdersByTenant as jest.Mock).mockResolvedValue([{ id: 'po-1' }]);
    const result = await service.findAll('t1');
    expect(result).toHaveLength(1);
  });

  it('should throw when order not found', async () => {
    (mockRepo.findOrderById as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow('Purchase order not found');
  });

  it('should update an existing order', async () => {
    (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1' });
    (mockRepo.updateOrder as jest.Mock).mockResolvedValue({ id: 'po-1', total: 1200 });
    const result = await service.update('po-1', { total: 1200 });
    expect(result).toHaveProperty('total', 1200);
  });

  it('should delete an existing order', async () => {
    (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1' });
    await service.delete('po-1');
    expect(mockRepo.deleteOrder).toHaveBeenCalledWith('po-1');
  });

  describe('approve', () => {
    it('should approve a pending order', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'pending' });
      (mockRepo.updateOrderStatus as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'approved' });
      const result = await service.approve('po-1');
      expect(result).toHaveProperty('status', 'approved');
    });

    it('should throw if not pending', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'approved' });
      await expect(service.approve('po-1')).rejects.toThrow('Only pending purchase orders can be approved');
    });
  });

  describe('receive', () => {
    it('should fully receive an order without lines', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', tenantId: 't1', status: 'approved' });
      (mockRepo.updateOrder as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'received' });

      const result = await service.receive('po-1');

      expect(result).toHaveProperty('status', 'received');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('document.received', expect.objectContaining({
        documentType: 'purchase_order',
      }));
    });

    it('should partially receive an order', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', tenantId: 't1', status: 'approved' });
      (mockRepo.findOrderLines as jest.Mock).mockResolvedValue([
        { lineId: 'l1', productId: 'p1', warehouseId: 'w1', quantity: 10, receivedQuantity: 0 },
      ]);
      (mockRepo.updateOrder as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'partial' });

      const result = await service.receive('po-1', { lines: [{ lineId: 'l1', quantity: 5 }] });

      expect(result).toHaveProperty('status', 'partial');
      expect(mockRepo.updateLineReceivedQuantity).toHaveBeenCalledWith('l1', 5);
    });

    it('should throw for already received order', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'received' });
      await expect(service.receive('po-1')).rejects.toThrow('Purchase order already received');
    });
  });

  describe('returnOrder', () => {
    it('should return items from received order', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', tenantId: 't1', status: 'received' });
      (mockRepo.createReturn as jest.Mock).mockResolvedValue({ id: 'ret-1', total: 200 });

      const result = await service.returnOrder('po-1', {
        reason: 'Damaged', subtotal: 180, taxAmount: 20, total: 200,
        lines: [{ productId: 'p1', warehouseId: 'w1', quantity: 2, unitPrice: 100 }],
      });

      expect(result).toHaveProperty('id', 'ret-1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('document.returned', expect.any(Object));
    });

    it('should throw if order not received', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'pending' });
      await expect(service.returnOrder('po-1', { reason: 'Damaged', subtotal: 180, taxAmount: 20, total: 200, lines: [] })).rejects.toThrow('Only received purchase orders can be returned');
    });
  });

  describe('completeReceive', () => {
    it('should complete partial receive', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'partial' });
      (mockRepo.findOrderLines as jest.Mock).mockResolvedValue([
        { lineId: 'l1', productId: 'p1', warehouseId: 'w1', quantity: 10, receivedQuantity: 7 },
      ]);
      (mockRepo.updateOrder as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'received' });

      const result = await service.completeReceive('po-1');

      expect(result).toHaveProperty('status', 'received');
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw if not partial', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'pending' });
      await expect(service.completeReceive('po-1')).rejects.toThrow('Only partially received orders can be completed');
    });
  });
});

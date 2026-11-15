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
    receiveOrder: jest.fn(),
    transitionReturnStatus: jest.fn(),
    validateReturnLines: jest.fn(),
  };
  const mockEventEmitter = { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue([]) };
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

  describe('receive contract', () => {
    const context = { tenantId: 't1', userId: 'u1' };
    const operationId = 'a7619b42-c607-4bfd-8de7-c2045aa5f61a';

    it.each([undefined, { lines: [] }, { lines: [{ lineId: 'l1', quantity: 0 }] },
      { lines: [{ lineId: 'l1', quantity: -1 }] },
      { lines: [{ lineId: 'l1', quantity: 1 }, { lineId: 'l1', quantity: 2 }] }])('rejects invalid batches before writing', async (dto) => {
      await expect(service.receive('po-1', dto, context)).rejects.toThrow();
      expect(mockRepo.receiveOrder).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitAsync).not.toHaveBeenCalled();
    });

    it('delegates deltas and emits the persisted batch, never omitted or accumulated lines', async () => {
      const event = { tenantId: 't1', documentId: 'po-1', triggeredBy: 'u1',
        metadata: { operationId, lines: [{ lineId: 'l1', productId: 'p1', warehouseId: 'w1', quantity: 3 }] } };
      (mockRepo.receiveOrder as jest.Mock).mockResolvedValue({ order: { id: 'po-1', status: 'partial' }, event });
      await service.receive('po-1', { operationId, lines: [{ lineId: 'l1', quantity: 3 }] }, context);
      expect(mockRepo.receiveOrder).toHaveBeenCalledWith('po-1', expect.objectContaining({ operationId, lines: [{ lineId: 'l1', quantity: 3 }] }), context);
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith('document.received', event);
      event.metadata.lines[0].quantity = 2;
      await service.receive('po-1', { operationId: 'b7619b42-c607-4bfd-8de7-c2045aa5f61a', lines: [{ lineId: 'l1', quantity: 2 }] }, context);
      expect(mockEventEmitter.emitAsync.mock.calls[1][1].metadata.lines[0].quantity).toBe(2);
    });

    it('does not emit after a transaction fails', async () => {
      (mockRepo.receiveOrder as jest.Mock).mockRejectedValue(new Error('conflict'));
      await expect(service.receive('po-1', { operationId, lines: [{ lineId: 'l1', quantity: 3 }] }, context)).rejects.toThrow('conflict');
      expect(mockEventEmitter.emitAsync).not.toHaveBeenCalled();
    });

    it('completes remaining quantities through the same atomic operation', async () => {
      (mockRepo.receiveOrder as jest.Mock).mockResolvedValue({ order: { status: 'received' }, event: { metadata: { operationId, lines: [] } } });
      await service.completeReceive('po-1', { operationId }, context);
      expect(mockRepo.receiveOrder).toHaveBeenCalledWith('po-1', { operationId, complete: true }, context);
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
      expect(mockEventEmitter.emitAsync).not.toHaveBeenCalled();
      expect(mockRepo.validateReturnLines).toHaveBeenCalledWith('t1', expect.any(Array));
    });

    it('should throw if order not received', async () => {
      (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'pending' });
      await expect(service.returnOrder('po-1', { reason: 'Damaged', subtotal: 180, taxAmount: 20, total: 200, lines: [] })).rejects.toThrow('Only received purchase orders can be returned');
    });
  });

  it('rejects tenant-mismatched order lookups and writes', async () => {
    (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', tenantId: 'other', status: 'pending' });
    await expect(service.findById('po-1', 't1')).rejects.toThrow('not found');
    await expect(service.approve('po-1', 't1')).rejects.toThrow('not found');
    await expect(service.update('po-1', { total: 1 }, 't1')).rejects.toThrow('not found');
    await expect(service.delete('po-1', 't1')).rejects.toThrow('not found');
    expect(mockRepo.updateOrder).not.toHaveBeenCalled();
  });

  it('rejects status bypass into received', async () => {
    (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'approved' });
    await expect(service.update('po-1', { status: 'received' })).rejects.toThrow('lifecycle');
    expect(mockRepo.updateOrder).not.toHaveBeenCalled();
  });
});

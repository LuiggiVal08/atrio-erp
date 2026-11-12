import { PurchaseOrderService } from '../../../src/modules/purchasing/application/purchase-order.service';
import { PurchasingRepository } from '../../../src/modules/purchasing/domain/purchasing.repository.interface';

describe('PurchaseOrderService.receive', () => {
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
  });

  it('should receive a pending purchase order', async () => {
    (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'pending' });
    (mockRepo.updateOrder as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'received' });

    const result = await service.receive('po-1');

    expect(result.status).toBe('received');
    expect(mockRepo.updateOrder).toHaveBeenCalledWith('po-1', { status: 'received', receivedAt: expect.any(Date) });
  });

  it('should throw if order not found', async () => {
    (mockRepo.findOrderById as jest.Mock).mockResolvedValue(null);

    await expect(service.receive('nonexistent')).rejects.toThrow('Purchase order not found');
  });

  it('should throw if order already received', async () => {
    (mockRepo.findOrderById as jest.Mock).mockResolvedValue({ id: 'po-1', status: 'received' });

    await expect(service.receive('po-1')).rejects.toThrow('already received');
  });
});

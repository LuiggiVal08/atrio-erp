import { SalesReturnService } from '../../../src/modules/sales/application/sales-return.service';
import { SalesReturnRepository } from '../../../src/modules/sales/domain/sales-return.repository.interface';
import { CommissionService } from '../../../src/modules/sales/application/commission.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SalesReturnService', () => {
  let service: SalesReturnService;
  const mockRepo: SalesReturnRepository = {
    create: jest.fn(),
    findByTenant: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };

  const mockEventEmitter: Partial<EventEmitter2> = { emit: jest.fn() };
  const mockCommissionService: Partial<CommissionService> = { adjustForReturn: jest.fn() };

  beforeEach(() => {
    service = new SalesReturnService(
      mockRepo,
      mockEventEmitter as EventEmitter2,
      mockCommissionService as CommissionService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a return with valid data', async () => {
      const dto = { tenantId: 't1', invoiceId: 'inv-1', reason: 'Damaged goods', subtotal: 100, taxAmount: 10, total: 110 };
      (mockRepo.create as jest.Mock).mockResolvedValue({ id: 'ret-1', ...dto, status: 'draft', returnedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('ret-1');
    });

    it('should reject negative total', async () => {
      const dto = { tenantId: 't1', invoiceId: 'inv-1', reason: 'test', subtotal: 0, taxAmount: 0, total: -10 };
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return returns for tenant', async () => {
      (mockRepo.findByTenant as jest.Mock).mockResolvedValue([{ id: 'ret-1' }]);
      const result = await service.findAll('t1');
      expect(mockRepo.findByTenant).toHaveBeenCalledWith('t1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return return when found', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue({ id: 'ret-1' });
      const result = await service.findById('ret-1');
      expect(result.id).toBe('ret-1');
    });

    it('should throw NotFoundException when not found', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should approve the return, adjust commissions and emit the return event', async () => {
      const lines = [{ productId: 'prod-1', warehouseId: 'wh-1', quantity: 2 }];
      const existingReturn = {
        id: 'ret-1', status: 'draft', tenantId: 't1', invoiceId: 'inv-1', total: 110,
        userId: 'user-1', lines, productCondition: 'saleable',
        resolution: 'refund_cash', cashRegisterId: 'reg-1',
      };
      (mockRepo.findById as jest.Mock).mockResolvedValue(existingReturn);
      (mockRepo.updateStatus as jest.Mock).mockResolvedValue({ ...existingReturn, status: 'approved' });
      const result = await service.updateStatus('ret-1', 'approved');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('ret-1', 'approved');
      expect(result.status).toBe('approved');
      expect(mockCommissionService.adjustForReturn).toHaveBeenCalledTimes(1);
      expect(mockCommissionService.adjustForReturn).toHaveBeenCalledWith('inv-1', 110);
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('document.returned', {
        eventType: 'document.returned',
        tenantId: 't1',
        documentId: 'ret-1',
        documentType: 'sales_return',
        timestamp: expect.any(String),
        triggeredBy: 'user-1',
        metadata: {
          operationId: 'ret-1',
          invoiceId: 'inv-1',
          lines: lines.map((line, index) => ({ ...line, lineId: String(index) })),
          productCondition: 'saleable',
          resolution: 'refund_cash',
          cashRegisterId: 'reg-1',
          amount: 110,
        },
      });
    });

    it('does not emit or adjust commission when approval is replayed', async () => {
      const existingReturn = {
        id: 'ret-1', status: 'approved', tenantId: 't1', invoiceId: 'inv-1', total: 110,
        userId: 'user-1', lines: [], productCondition: 'saleable',
      };
      (mockRepo.findById as jest.Mock).mockResolvedValue(existingReturn);
      (mockRepo.updateStatus as jest.Mock).mockResolvedValue({ ...existingReturn, status: 'approved' });

      await service.updateStatus('ret-1', 'approved');

      expect(mockCommissionService.adjustForReturn).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('does not emit stock on completion after approval', async () => {
      const existingReturn = {
        id: 'ret-1', status: 'approved', tenantId: 't1', invoiceId: 'inv-1', total: 110,
        userId: 'user-1', lines: [], productCondition: 'saleable',
      };
      (mockRepo.findById as jest.Mock).mockResolvedValue(existingReturn);
      (mockRepo.updateStatus as jest.Mock).mockResolvedValue({ ...existingReturn, status: 'completed' });

      await service.updateStatus('ret-1', 'completed');

      expect(mockCommissionService.adjustForReturn).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('includes stable line identity for idempotent stock returns', async () => {
      const existingReturn = {
        id: 'ret-1', status: 'draft', tenantId: 't1', invoiceId: 'inv-1', total: 0,
        userId: 'user-1', lines: [{ productId: 'prod-1', warehouseId: 'wh-1', quantity: 1 }],
        productCondition: 'saleable',
      };
      (mockRepo.findById as jest.Mock).mockResolvedValue(existingReturn);
      (mockRepo.updateStatus as jest.Mock).mockResolvedValue({ ...existingReturn, status: 'approved' });

      await service.updateStatus('ret-1', 'approved');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('document.returned', expect.objectContaining({
        metadata: expect.objectContaining({
          operationId: 'ret-1',
          lines: [{ productId: 'prod-1', warehouseId: 'wh-1', quantity: 1, lineId: '0' }],
        }),
      }));
    });

    it('should throw when return not found', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.updateStatus('nonexistent', 'approved')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete when return exists', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue({ id: 'ret-1' });
      await service.delete('ret-1');
      expect(mockRepo.delete).toHaveBeenCalledWith('ret-1');
    });

    it('should throw when return not found', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});

import { SalesReturnService } from '../../../src/modules/sales/application/sales-return.service';
import { SalesReturnRepository } from '../../../src/modules/sales/domain/sales-return.repository.interface';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SalesReturnService', () => {
  let service: SalesReturnService;
  const mockRepo: SalesReturnRepository = {
    create: jest.fn(),
    findByTenant: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    service = new SalesReturnService(mockRepo);
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
    it('should update status when return exists', async () => {
      (mockRepo.findById as jest.Mock).mockResolvedValue({ id: 'ret-1', status: 'draft' });
      (mockRepo.updateStatus as jest.Mock).mockResolvedValue({ id: 'ret-1', status: 'approved' });
      const result = await service.updateStatus('ret-1', 'approved');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('ret-1', 'approved');
      expect(result.status).toBe('approved');
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

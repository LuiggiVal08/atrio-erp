import { AuditService } from '../../../src/common/audit/audit.service';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  const mockPrisma = {
    auditLog: { create: jest.fn() },
  } as unknown as PrismaService;

  beforeEach(() => {
    service = new AuditService(mockPrisma);
    jest.clearAllMocks();
  });

  it('should create an audit log entry', async () => {
    await service.log({
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'product.create',
      entityType: 'product',
      entityId: 'prod-1',
      after: { name: 'Laptop', sku: 'LAP-001' },
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        entityType: 'product',
        entityId: 'prod-1',
        action: 'product.create',
        before: null,
        after: { name: 'Laptop', sku: 'LAP-001' },
        userId: 'user-1',
        tenantId: 'tenant-1',
      },
    });
  });

  it('should log with before state on update', async () => {
    const before = { name: 'Old Name' };
    const after = { name: 'New Name' };

    await service.log({
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'product.update',
      entityType: 'product',
      entityId: 'prod-1',
      before,
      after,
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        entityType: 'product',
        entityId: 'prod-1',
        action: 'product.update',
        before,
        after,
        userId: 'user-1',
        tenantId: 'tenant-1',
      },
    });
  });

  it('should log soft-delete without after state', async () => {
    const before = { name: 'Laptop', isActive: true };

    await service.log({
      tenantId: 'tenant-1',
      userId: 'user-1',
      action: 'product.soft-delete',
      entityType: 'product',
      entityId: 'prod-1',
      before,
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        entityType: 'product',
        entityId: 'prod-1',
        action: 'product.soft-delete',
        before,
        after: null,
        userId: 'user-1',
        tenantId: 'tenant-1',
      },
    });
  });
});

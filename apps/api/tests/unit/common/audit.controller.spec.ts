import { AuditController } from '../../../src/common/audit/audit.controller';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('AuditController', () => {
  let controller: AuditController;
  const mockPrisma = {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    controller = new AuditController(mockPrisma);
    jest.clearAllMocks();
  });

  it('should return filtered audit logs', async () => {
    const items = [{ id: 'log-1', action: 'product.create' }];
    (mockPrisma.auditLog.findMany as jest.Mock).mockResolvedValue(items);
    (mockPrisma.auditLog.count as jest.Mock).mockResolvedValue(1);

    const result = await controller.findAll(
      'tenant-1', 'product.create', 'product', '2026-01-01', '2026-12-31', '50', '0',
    );

    expect(result).toEqual({ items, total: 1 });
  });

  it('should return all audit logs without filters', async () => {
    const items = [{ id: 'log-1' }, { id: 'log-2' }];
    (mockPrisma.auditLog.findMany as jest.Mock).mockResolvedValue(items);
    (mockPrisma.auditLog.count as jest.Mock).mockResolvedValue(2);

    const result = await controller.findAll();

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should return a single audit log by id', async () => {
    const log = { id: 'log-1', action: 'product.create' };
    (mockPrisma.auditLog.findUniqueOrThrow as jest.Mock).mockResolvedValue(log);

    const result = await controller.findOne('log-1');

    expect(result).toEqual(log);
    expect(mockPrisma.auditLog.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'log-1' },
    });
  });
});

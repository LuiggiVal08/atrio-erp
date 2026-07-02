import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../../../src/modules/reports/application/dashboard.service';
import { REPORTS_REPOSITORY } from '../../../src/modules/reports/domain/report.repository.interface';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ total: 1000 }]),
    client: { count: jest.fn().mockResolvedValue(10) },
    document: { count: jest.fn().mockResolvedValue(5) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ enabledModules: ['sales', 'inventory', 'client-vendor', 'cash-payments'] }) },
  };

  const mockRepo = {
    findWidgets: jest.fn().mockResolvedValue([]),
    createWidget: jest.fn(),
    updateWidget: jest.fn(),
    deleteWidget: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: REPORTS_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
  });

  it('should return summary KPIs', async () => {
    const result = await service.getSummary('tenant-1');
    expect(result).toHaveProperty('todaySales');
    expect(result).toHaveProperty('monthSales');
    expect(result).toHaveProperty('lowStockProducts');
  });

  it('should return sales trend', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { date: '2026-06-01', total: 500 },
      { date: '2026-06-02', total: 750 },
    ]);
    const result = await service.getSalesTrend('tenant-1', new Date('2026-06-01'), new Date('2026-06-30'));
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

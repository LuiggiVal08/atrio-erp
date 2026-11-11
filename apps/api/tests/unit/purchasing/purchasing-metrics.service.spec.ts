import { PurchasingMetricsService } from '@/modules/purchasing/application/purchasing-metrics.service';

const prisma = {
  purchaseOrder: { findMany: jest.fn() },
  partner: { findMany: jest.fn(), findUnique: jest.fn() },
  partnerCategory: { findMany: jest.fn() },
};

describe('PurchasingMetricsService', () => {
  let service: PurchasingMetricsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PurchasingMetricsService(prisma as any);
  });

  describe('getDeliveryMetrics', () => {
    it('classifies received orders and counts pending and overdue orders', async () => {
      prisma.purchaseOrder.findMany
        .mockResolvedValueOnce([
          {
            vendorId: 'v1',
            createdAt: new Date('2026-01-01T00:00:00Z'),
            expectedDate: new Date('2026-01-10T00:00:00Z'),
            receivedAt: new Date('2026-01-08T00:00:00Z'),
            total: 100,
          },
          {
            vendorId: 'v1',
            createdAt: new Date('2026-01-02T00:00:00Z'),
            expectedDate: new Date('2026-01-10T00:00:00Z'),
            receivedAt: new Date('2026-01-11T00:00:00Z'),
            total: 200,
          },
        ])
        .mockResolvedValueOnce([
          {
            vendorId: 'v1',
            createdAt: new Date('2026-01-01T00:00:00Z'),
            expectedDate: new Date('2026-01-01T00:00:00Z'),
          },
        ]);
      prisma.partner.findMany.mockResolvedValue([
        { id: 'v1', legalName: 'Acme', deliveryDays: 5 },
      ]);

      const [row] = await service.getDeliveryMetrics('t1');

      expect(row).toMatchObject({
        vendorId: 'v1',
        vendorName: 'Acme',
        orders: 2,
        early: 1,
        onTime: 0,
        late: 1,
        unknown: 0,
        promisedDays: 5,
        pendingOrders: 1,
        overdueOrders: 1,
        totalSpend: 300,
        avgActualDays: 8,
        avgEarlyDays: 2,
        avgLateDays: 1,
        avgDelayDays: -0.5,
        lastReceivedAt: new Date('2026-01-11T00:00:00Z').toISOString(),
        lastTiming: 'LATE',
      });
    });

    it('falls back to the partner promised delivery days when there is no expected date', async () => {
      prisma.purchaseOrder.findMany
        .mockResolvedValueOnce([
          {
            vendorId: 'v1',
            createdAt: new Date('2026-01-01T00:00:00Z'),
            expectedDate: null,
            receivedAt: new Date('2026-01-06T00:00:00Z'),
            total: 50,
          },
        ])
        .mockResolvedValueOnce([
          {
            vendorId: 'v1',
            createdAt: new Date('2026-01-01T00:00:00Z'),
            expectedDate: null,
          },
        ]);
      prisma.partner.findMany.mockResolvedValue([
        { id: 'v1', legalName: 'Acme', deliveryDays: 5 },
      ]);

      const [row] = await service.getDeliveryMetrics('t1');

      expect(row).toMatchObject({
        orders: 1,
        early: 0,
        onTime: 1,
        late: 0,
        pendingOrders: 1,
        overdueOrders: 1,
      });
    });

    it('returns an empty list when there are no orders', async () => {
      prisma.purchaseOrder.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await expect(service.getDeliveryMetrics('t1')).resolves.toEqual([]);
      expect(prisma.partner.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getPendingDeliveries', () => {
    it('sorts overdue orders first and resolves the vendor name', async () => {
      prisma.purchaseOrder.findMany.mockResolvedValue([
        {
          id: 'po-future',
          documentId: 'PO-3',
          vendorId: 'v1',
          status: 'approved',
          expectedDate: new Date('2999-01-01T00:00:00Z'),
          createdAt: new Date('2026-01-01T00:00:00Z'),
          total: 300,
          currency: 'USD',
        },
        {
          id: 'po-no-date',
          documentId: 'PO-2',
          vendorId: 'v2',
          status: 'pending',
          expectedDate: null,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          total: 200,
          currency: 'USD',
        },
        {
          id: 'po-overdue',
          documentId: 'PO-1',
          vendorId: 'v1',
          status: 'approved',
          expectedDate: new Date('2020-01-01T00:00:00Z'),
          createdAt: new Date('2019-12-01T00:00:00Z'),
          total: 100,
          currency: 'USD',
        },
      ]);
      prisma.partner.findMany.mockResolvedValue([
        { id: 'v1', legalName: 'Acme', deliveryDays: 5 },
        { id: 'v2', legalName: 'Beta', deliveryDays: null },
      ]);

      const rows = await service.getPendingDeliveries('t1');

      expect(rows.map((row) => row.id)).toEqual(['po-overdue', 'po-future', 'po-no-date']);
      expect(rows[0]).toMatchObject({ vendorName: 'Acme', documentId: 'PO-1' });
      expect(rows[0].daysUntilDue).toBeLessThan(0);
      expect(rows[1].daysUntilDue).toBeGreaterThan(0);
      expect(rows[2].daysUntilDue).toBeNull();
    });
  });

  describe('getVendorDeliveryHistory', () => {
    it('classifies each order and keeps the vendor promised days as fallback', async () => {
      prisma.partner.findUnique.mockResolvedValue({ deliveryDays: 5 });
      prisma.purchaseOrder.findMany.mockResolvedValue([
        {
          id: 'po-1',
          documentId: 'PO-1',
          status: 'received',
          expectedDate: new Date('2026-01-10T00:00:00Z'),
          receivedAt: new Date('2026-01-08T00:00:00Z'),
          createdAt: new Date('2026-01-01T00:00:00Z'),
          total: 100,
          currency: 'USD',
        },
        {
          id: 'po-2',
          documentId: 'PO-2',
          status: 'received',
          expectedDate: null,
          receivedAt: new Date('2026-01-06T00:00:00Z'),
          createdAt: new Date('2026-01-01T00:00:00Z'),
          total: 200,
          currency: 'USD',
        },
        {
          id: 'po-3',
          documentId: 'PO-3',
          status: 'approved',
          expectedDate: new Date('2026-01-10T00:00:00Z'),
          receivedAt: null,
          createdAt: new Date('2026-01-02T00:00:00Z'),
          total: 300,
          currency: 'USD',
        },
      ]);

      const rows = await service.getVendorDeliveryHistory('t1', 'v1');

      expect(rows).toHaveLength(3);
      expect(rows[0]).toMatchObject({ id: 'po-1', timing: 'EARLY', delayDays: -2 });
      expect(rows[1]).toMatchObject({ id: 'po-2', timing: 'ON_TIME', delayDays: 0 });
      expect(rows[2]).toMatchObject({ id: 'po-3', timing: 'UNKNOWN', delayDays: null });
      expect(rows[0].expectedDate).toBe(new Date('2026-01-10T00:00:00Z').toISOString());
      expect(rows[0].receivedAt).toBe(new Date('2026-01-08T00:00:00Z').toISOString());
    });
  });
});

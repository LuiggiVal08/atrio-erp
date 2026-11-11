import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  MS_PER_DAY,
  addDays,
  classifyDelivery,
  daysBetween,
  startOfUtcDay,
  type DeliveryTiming,
} from './delivery-classification';

export interface DeliveryMetricRow {
  vendorId: string;
  vendorName: string;
  orders: number;
  early: number;
  onTime: number;
  late: number;
  unknown: number;
  promisedDays: number | null;
  avgActualDays: number | null;
  avgDelayDays: number | null;
  avgEarlyDays: number | null;
  avgLateDays: number | null;
  totalSpend: number;
  lastReceivedAt: string | null;
  lastTiming: DeliveryTiming | null;
  pendingOrders: number;
  overdueOrders: number;
}

export interface SpendByCategoryRow {
  categoryId: string | null;
  categoryName: string;
  totalSpend: number;
  orders: number;
}

export interface VendorDeliveryOrderRow {
  id: string;
  documentId: string;
  status: string;
  expectedDate: string | null;
  receivedAt: string | null;
  createdAt: string;
  total: number;
  currency: string;
  delayDays: number | null;
  timing: DeliveryTiming;
}

export interface PendingDeliveryRow {
  id: string;
  documentId: string;
  vendorId: string;
  vendorName: string;
  status: string;
  expectedDate: string | null;
  daysUntilDue: number | null;
  total: number;
  currency: string;
}

interface DeliveryAccumulator {
  vendorName: string;
  promisedDays: number | null;
  orders: number;
  early: number;
  onTime: number;
  late: number;
  unknown: number;
  actualDaysSum: number;
  delaySum: number;
  delayCount: number;
  earlyDaysSum: number;
  lateDaysSum: number;
  totalSpend: number;
  lastReceivedAt: Date | null;
  lastTiming: DeliveryTiming | null;
  pendingOrders: number;
  overdueOrders: number;
}

@Injectable()
export class PurchasingMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeliveryMetrics(tenantId: string, from?: string, to?: string): Promise<DeliveryMetricRow[]> {
    const createdAt = from || to
      ? {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        }
      : undefined;

    const [receivedOrders, openOrders] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { tenantId, receivedAt: { not: null }, ...(createdAt ? { createdAt } : {}) },
        select: { vendorId: true, createdAt: true, expectedDate: true, receivedAt: true, total: true },
      }),
      this.prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          receivedAt: null,
          status: { notIn: ['received', 'cancelled'] },
          ...(createdAt ? { createdAt } : {}),
        },
        select: { vendorId: true, createdAt: true, expectedDate: true },
      }),
    ]);
    if (!receivedOrders.length && !openOrders.length) return [];

    const vendorIds = Array.from(new Set([...receivedOrders, ...openOrders].map((o) => o.vendorId)));
    const partners = await this.prisma.partner.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, legalName: true, deliveryDays: true },
    });
    const partnerMap = new Map(partners.map((p) => [p.id, p]));

    const acc = new Map<string, DeliveryAccumulator>();
    const getEntry = (vendorId: string): DeliveryAccumulator => {
      const existing = acc.get(vendorId);
      if (existing) return existing;
      const partner = partnerMap.get(vendorId);
      return {
        vendorName: partner?.legalName ?? vendorId,
        promisedDays: partner?.deliveryDays ?? null,
        orders: 0,
        early: 0,
        onTime: 0,
        late: 0,
        unknown: 0,
        actualDaysSum: 0,
        delaySum: 0,
        delayCount: 0,
        earlyDaysSum: 0,
        lateDaysSum: 0,
        totalSpend: 0,
        lastReceivedAt: null,
        lastTiming: null,
        pendingOrders: 0,
        overdueOrders: 0,
      };
    };

    const today = startOfUtcDay(new Date());

    for (const order of receivedOrders) {
      const entry = getEntry(order.vendorId);
      const receivedAt = order.receivedAt!;
      const actualDays = daysBetween(order.createdAt, receivedAt);
      const reference = order.expectedDate ?? (entry.promisedDays != null ? addDays(order.createdAt, entry.promisedDays) : null);
      const { timing, delayDays } = classifyDelivery(reference, receivedAt);

      entry.orders += 1;
      entry.actualDaysSum += actualDays;
      entry.totalSpend += order.total;
      if (timing === 'EARLY') {
        entry.early += 1;
        entry.earlyDaysSum += Math.abs(delayDays!);
      } else if (timing === 'ON_TIME') {
        entry.onTime += 1;
      } else if (timing === 'LATE') {
        entry.late += 1;
        entry.lateDaysSum += delayDays!;
      } else {
        entry.unknown += 1;
      }
      if (delayDays != null) {
        entry.delaySum += delayDays;
        entry.delayCount += 1;
      }
      if (!entry.lastReceivedAt || receivedAt > entry.lastReceivedAt) {
        entry.lastReceivedAt = receivedAt;
        entry.lastTiming = timing;
      }
      acc.set(order.vendorId, entry);
    }

    for (const order of openOrders) {
      const entry = getEntry(order.vendorId);
      const reference = order.expectedDate ?? (entry.promisedDays != null ? addDays(order.createdAt, entry.promisedDays) : null);
      entry.pendingOrders += 1;
      if (reference && startOfUtcDay(reference) < today) entry.overdueOrders += 1;
      acc.set(order.vendorId, entry);
    }

    return Array.from(acc.entries())
      .map(([vendorId, e]) => ({
        vendorId,
        vendorName: e.vendorName,
        orders: e.orders,
        early: e.early,
        onTime: e.onTime,
        late: e.late,
        unknown: e.unknown,
        promisedDays: e.promisedDays,
        avgActualDays: e.orders ? Number((e.actualDaysSum / e.orders).toFixed(2)) : null,
        avgDelayDays: e.delayCount ? Number((e.delaySum / e.delayCount).toFixed(2)) : null,
        avgEarlyDays: e.early ? Number((e.earlyDaysSum / e.early).toFixed(2)) : null,
        avgLateDays: e.late ? Number((e.lateDaysSum / e.late).toFixed(2)) : null,
        totalSpend: Number(e.totalSpend.toFixed(2)),
        lastReceivedAt: e.lastReceivedAt ? e.lastReceivedAt.toISOString() : null,
        lastTiming: e.lastTiming,
        pendingOrders: e.pendingOrders,
        overdueOrders: e.overdueOrders,
      }))
      .sort((a, b) => b.orders - a.orders || b.overdueOrders - a.overdueOrders);
  }

  async getVendorDeliveryHistory(
    tenantId: string,
    vendorId: string,
    from?: string,
    to?: string,
  ): Promise<VendorDeliveryOrderRow[]> {
    const partner = await this.prisma.partner.findUnique({
      where: { id: vendorId },
      select: { deliveryDays: true },
    });
    const where: any = { tenantId, vendorId, status: { not: 'cancelled' } };
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const orders = await this.prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        documentId: true,
        status: true,
        expectedDate: true,
        receivedAt: true,
        createdAt: true,
        total: true,
        currency: true,
      },
    });

    return orders.map((order) => {
      const reference = order.expectedDate
        ?? (partner?.deliveryDays != null ? addDays(order.createdAt, partner.deliveryDays) : null);
      const { timing, delayDays } = classifyDelivery(reference, order.receivedAt);
      return {
        id: order.id,
        documentId: order.documentId,
        status: order.status,
        expectedDate: order.expectedDate ? order.expectedDate.toISOString() : null,
        receivedAt: order.receivedAt ? order.receivedAt.toISOString() : null,
        createdAt: order.createdAt.toISOString(),
        total: order.total,
        currency: order.currency,
        delayDays,
        timing,
      };
    });
  }

  async getPendingDeliveries(tenantId: string, from?: string, to?: string): Promise<PendingDeliveryRow[]> {
    const where: any = {
      tenantId,
      receivedAt: null,
      status: { notIn: ['received', 'cancelled'] },
    };
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const orders = await this.prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        documentId: true,
        vendorId: true,
        status: true,
        expectedDate: true,
        createdAt: true,
        total: true,
        currency: true,
      },
    });
    if (!orders.length) return [];

    const vendorIds = Array.from(new Set(orders.map((o) => o.vendorId)));
    const partners = await this.prisma.partner.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, legalName: true, deliveryDays: true },
    });
    const partnerMap = new Map(partners.map((p) => [p.id, p]));
    const today = startOfUtcDay(new Date());

    return orders
      .map((order) => {
        const partner = partnerMap.get(order.vendorId);
        const reference = order.expectedDate
          ?? (partner?.deliveryDays != null ? addDays(order.createdAt, partner.deliveryDays) : null);
        const daysUntilDue = reference
          ? Math.round((startOfUtcDay(reference) - today) / MS_PER_DAY)
          : null;
        return {
          id: order.id,
          documentId: order.documentId,
          vendorId: order.vendorId,
          vendorName: partner?.legalName ?? order.vendorId,
          status: order.status,
          expectedDate: order.expectedDate ? order.expectedDate.toISOString() : null,
          daysUntilDue,
          total: order.total,
          currency: order.currency,
        };
      })
      .sort((a, b) => {
        if (a.daysUntilDue == null && b.daysUntilDue == null) return 0;
        if (a.daysUntilDue == null) return 1;
        if (b.daysUntilDue == null) return -1;
        return a.daysUntilDue - b.daysUntilDue;
      });
  }

  async getSpendByCategory(tenantId: string, from?: string, to?: string): Promise<SpendByCategoryRow[]> {
    const where: any = { tenantId };
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const orders = await this.prisma.purchaseOrder.findMany({
      where,
      select: { vendorId: true, total: true },
    });
    if (!orders.length) return [];

    const vendorIds = Array.from(new Set(orders.map((o) => o.vendorId)));
    const partnerCategories = await this.prisma.partnerCategory.findMany({
      where: { partnerId: { in: vendorIds } },
      include: { category: { select: { id: true, name: true } } },
    });

    const categoriesByPartner = new Map<string, { id: string; name: string }[]>();
    for (const pc of partnerCategories) {
      const list = categoriesByPartner.get(pc.partnerId) ?? [];
      list.push({ id: pc.category.id, name: pc.category.name });
      categoriesByPartner.set(pc.partnerId, list);
    }

    const acc = new Map<string, SpendByCategoryRow>();
    const addSpend = (categoryId: string | null, categoryName: string, total: number) => {
      const key = categoryId ?? '__uncategorized__';
      const entry = acc.get(key) ?? { categoryId, categoryName, totalSpend: 0, orders: 0 };
      entry.totalSpend += total;
      entry.orders += 1;
      acc.set(key, entry);
    };

    for (const order of orders) {
      const categories = categoriesByPartner.get(order.vendorId);
      if (!categories?.length) {
        addSpend(null, 'Sin categoría', order.total);
        continue;
      }
      for (const category of categories) {
        addSpend(category.id, category.name, order.total);
      }
    }

    return Array.from(acc.values())
      .map((row) => ({ ...row, totalSpend: Number(row.totalSpend.toFixed(2)) }))
      .sort((a, b) => b.totalSpend - a.totalSpend);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

const COVERAGE_PERIOD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface InventorySummary {
  totalProducts: number;
  stockHealth: { healthy: number; low: number; out: number; overstock: number };
  valuation: {
    currency: string;
    totalValue: number;
    categories: Array<{ categoryId: string | null; name: string | null; value: number }>;
  };
  coverage: {
    periodDays: number;
    medianDays: number | null;
    under7: number;
    from7to30: number;
    over30: number;
    noSales: number;
  };
}

@Injectable()
export class InventorySummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string): Promise<InventorySummary> {
    const now = new Date();
    const since = new Date(now.getTime() - COVERAGE_PERIOD_DAYS * DAY_MS);

    const [tenant, products, soldLines] = await Promise.all([
      this.prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: { baseCurrency: true },
      }),
      this.prisma.product.findMany({
        where: { tenantId, deletedAt: null, isActive: true, isService: false },
        select: {
          id: true,
          categoryId: true,
          costPrice: true,
          minStock: true,
          maxStock: true,
          reorderPoint: true,
          category: { select: { name: true } },
          stock: {
            where: { warehouse: { tenantId } },
            select: { quantity: true },
          },
        },
      }),
      this.prisma.documentLine.groupBy({
        by: ['productId'],
        where: {
          productId: { not: null },
          quantity: { gt: 0 },
          document: {
            tenantId,
            deletedAt: null,
            documentType: 'sales_invoice',
            status: { in: ['approved', 'paid'] },
            approvedAt: { gte: since, lte: now },
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const soldByProduct = new Map<string, number>();
    for (const line of soldLines) {
      if (line.productId) soldByProduct.set(line.productId, Number(line._sum.quantity ?? 0));
    }

    const stockHealth = { healthy: 0, low: 0, out: 0, overstock: 0 };
    const categoryValues = new Map<string | null, { categoryId: string | null; name: string | null; value: number }>();
    const coverages: number[] = [];
    const buckets = { under7: 0, from7to30: 0, over30: 0, noSales: 0 };
    let totalValue = 0;

    for (const product of products) {
      // Negative balances are treated as out of stock and excluded from valuation.
      const quantity = Math.max(0, product.stock.reduce((sum, s) => sum + s.quantity, 0));

      if (quantity <= 0) stockHealth.out += 1;
      else if (product.maxStock !== null && quantity > product.maxStock) stockHealth.overstock += 1;
      else if (quantity <= Math.max(product.minStock, product.reorderPoint)) stockHealth.low += 1;
      else stockHealth.healthy += 1;

      const value = quantity * product.costPrice;
      totalValue += value;
      const key = product.categoryId;
      const entry = categoryValues.get(key) ?? { categoryId: key, name: product.category?.name ?? null, value: 0 };
      entry.value += value;
      categoryValues.set(key, entry);

      const sold = soldByProduct.get(product.id) ?? 0;
      if (sold <= 0) {
        buckets.noSales += 1;
        continue;
      }
      const days = (quantity * COVERAGE_PERIOD_DAYS) / sold;
      coverages.push(days);
      if (days < 7) buckets.under7 += 1;
      else if (days <= 30) buckets.from7to30 += 1;
      else buckets.over30 += 1;
    }

    coverages.sort((a, b) => a - b);
    const mid = Math.floor(coverages.length / 2);
    const median = coverages.length === 0
      ? null
      : coverages.length % 2 === 1
        ? coverages[mid]
        : (coverages[mid - 1] + coverages[mid]) / 2;

    const round2 = (n: number) => Math.round(n * 100) / 100;

    return {
      totalProducts: products.length,
      stockHealth,
      valuation: {
        currency: tenant.baseCurrency,
        totalValue: round2(totalValue),
        categories: Array.from(categoryValues.values())
          .map((c) => ({ ...c, value: round2(c.value) }))
          .sort((a, b) => b.value - a.value),
      },
      coverage: {
        periodDays: COVERAGE_PERIOD_DAYS,
        medianDays: median === null ? null : Math.round(median * 10) / 10,
        ...buckets,
      },
    };
  }
}

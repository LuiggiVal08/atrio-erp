import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { IReportsRepository, REPORTS_REPOSITORY } from '../domain/report.repository.interface';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REPORTS_REPOSITORY)
    private readonly repo: IReportsRepository,
  ) {}

  async getSummary(tenantId: string): Promise<Record<string, any>> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { enabledModules: true } });
    const enabled = new Set(tenant?.enabledModules ?? []);
    const prisma = this.prisma;
    const tid = tenantId;

    const querySales = async () => {
      if (!enabled.has('sales')) return { todaySales: 0, monthSales: 0, prevMonthSales: 0, pendingOrders: 0 };
      const [todayRes, monthRes, prevRes, pending] = await Promise.all([
        prisma.$queryRaw<{ total: number }[]>`
          SELECT COALESCE(SUM(grand_total), 0) as total FROM documents
          WHERE tenant_id = ${tid}::uuid AND document_type = 'sales_invoice' AND status = 'paid'
          AND created_at >= ${new Date(now.getFullYear(), now.getMonth(), now.getDate())}::date
        `,
        prisma.$queryRaw<{ total: number }[]>`
          SELECT COALESCE(SUM(grand_total), 0) as total FROM documents
          WHERE tenant_id = ${tid}::uuid AND document_type = 'sales_invoice' AND status = 'paid'
          AND created_at >= ${startOfMonth}
        `,
        prisma.$queryRaw<{ total: number }[]>`
          SELECT COALESCE(SUM(grand_total), 0) as total FROM documents
          WHERE tenant_id = ${tid}::uuid AND document_type = 'sales_invoice' AND status = 'paid'
          AND created_at >= ${startOfPrevMonth} AND created_at < ${startOfMonth}
        `,
        prisma.document.count({ where: { tenantId: tid, documentType: 'sales_invoice', status: 'pending_approval' } }),
      ]);
      return {
        todaySales: Number(todayRes[0]?.total ?? 0),
        monthSales: Number(monthRes[0]?.total ?? 0),
        prevMonthSales: Number(prevRes[0]?.total ?? 0),
        pendingOrders: pending,
      };
    };

    const queryClients = async () => {
      if (!enabled.has('client-vendor')) return { activeClients: 0 };
      const count = await prisma.client.count({ where: { tenantId: tid, isActive: true } });
      return { activeClients: count };
    };

    const queryInventory = async () => {
      if (!enabled.has('inventory')) return { lowStockProducts: 0 };
      const result = await prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*) as count FROM stock s
        JOIN products p ON p.id = s.product_id
        WHERE p.tenant_id = ${tid}::uuid AND p.is_active = true
        AND s.quantity < 10
      `;
      return { lowStockProducts: Number(result[0]?.count ?? 0) };
    };

    const queryCash = async () => {
      if (!enabled.has('cash-payments')) return { todayCashMovements: 0 };
      const result = await prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*) as count FROM cash_movements cm
        JOIN cash_registers cr ON cr.id = cm.register_id
        WHERE cr.tenant_id = ${tid}::uuid
        AND cm.created_at >= ${new Date(now.getFullYear(), now.getMonth(), now.getDate())}::date
      `;
      return { todayCashMovements: Number(result[0]?.count ?? 0) };
    };

    const [sales, clients, inventory, cash] = await Promise.all([
      querySales(),
      queryClients(),
      queryInventory(),
      queryCash(),
    ]);

    const salesChange = sales.prevMonthSales > 0
      ? ((sales.monthSales - sales.prevMonthSales) / sales.prevMonthSales) * 100
      : 0;

    return {
      todaySales: sales.todaySales,
      monthSales: sales.monthSales,
      monthSalesPrev: sales.prevMonthSales,
      salesChange: Math.round(salesChange * 100) / 100,
      activeClients: clients.activeClients,
      lowStockProducts: inventory.lowStockProducts,
      todayCashMovements: cash.todayCashMovements,
      pendingOrders: sales.pendingOrders,
    };
  }

  async getSalesTrend(tenantId: string, dateFrom: Date, dateTo: Date): Promise<{ date: string; total: number }[]> {
    const result = await this.prisma.$queryRaw<{ date: string; total: number }[]>`
      SELECT DATE(created_at) as date, COALESCE(SUM(grand_total), 0) as total
      FROM documents
      WHERE tenant_id = ${tenantId}::uuid AND document_type = 'sales_invoice' AND status = 'paid'
      AND created_at >= ${dateFrom} AND created_at <= ${dateTo}
      GROUP BY DATE(created_at) ORDER BY date ASC
    `;
    return result.map((r) => ({ date: String(r.date), total: Number(r.total) }));
  }

  async getTopProducts(tenantId: string, limit: number): Promise<{ product: string; quantity: number; total: number }[]> {
    const result = await this.prisma.$queryRaw<{ product: string; quantity: number; total: number }[]>`
      SELECT p.name as product, SUM(dl.quantity) as quantity, SUM(dl.line_total) as total
      FROM document_lines dl
      JOIN documents d ON d.id = dl.document_id
      JOIN products p ON p.id = dl.product_id
      WHERE d.tenant_id = ${tenantId}::uuid AND d.document_type = 'sales_invoice' AND d.status = 'paid'
      GROUP BY p.name ORDER BY total DESC LIMIT ${limit}
    `;
    return result.map((r) => ({ product: r.product, quantity: Number(r.quantity), total: Number(r.total) }));
  }

  async getLowStock(tenantId: string): Promise<{ product: string; sku: string; warehouse: string; quantity: number }[]> {
    const result = await this.prisma.$queryRaw<{ product: string; sku: string; warehouse: string; quantity: number }[]>`
      SELECT p.name as product, p.sku, w.name as warehouse, s.quantity
      FROM stock s
      JOIN products p ON p.id = s.product_id
      JOIN warehouses w ON w.id = s.warehouse_id
      WHERE p.tenant_id = ${tenantId}::uuid AND p.is_active = true
      AND s.quantity < 10
      ORDER BY s.quantity ASC
    `;
    return result.map((r) => ({ product: r.product, sku: r.sku, warehouse: r.warehouse, quantity: Number(r.quantity) }));
  }
}

import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { listQueryOptions, txQueryOptions } from '@/core/lib/query-defaults';

interface DashboardSummary {
  todaySales: number;
  monthSales: number;
  monthSalesPrev: number;
  salesChange: number;
  activeClients: number;
  lowStockProducts: number;
  todayCashMovements: number;
  pendingOrders: number;
}

interface SalesTrend {
  date: string;
  total: number;
}

interface TopProduct {
  product: string;
  quantity: number;
  total: number;
}

interface LowStockItem {
  product: string;
  sku: string;
  warehouse: string;
  quantity: number;
}

interface Widget {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  config: Record<string, any>;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['reports', 'dashboard', 'summary'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard/summary');
      return res.data;
    },
    ...txQueryOptions(),
    ...listQueryOptions(),
  });
}

export function useSalesTrend(dateFrom: string, dateTo: string) {
  return useQuery<SalesTrend[]>({
    queryKey: ['reports', 'dashboard', 'sales-trend', dateFrom, dateTo],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard/sales-trend', {
        params: { dateFrom, dateTo },
      });
      return res.data;
    },
    ...txQueryOptions(),
    ...listQueryOptions(),
  });
}

export function useTopProducts(limit = 10) {
  return useQuery<TopProduct[]>({
    queryKey: ['reports', 'dashboard', 'top-products', limit],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard/top-products', {
        params: { limit },
      });
      return res.data;
    },
    ...txQueryOptions(),
    ...listQueryOptions(),
  });
}

export function useLowStock() {
  return useQuery<LowStockItem[]>({
    queryKey: ['reports', 'dashboard', 'low-stock'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard/low-stock');
      return res.data;
    },
    ...txQueryOptions(),
    ...listQueryOptions(),
  });
}

export function useWidgets() {
  return useQuery<Widget[]>({
    queryKey: ['reports', 'widgets'],
    queryFn: async () => {
      const res = await api.get('/reports/widgets');
      return res.data;
    },
  });
}

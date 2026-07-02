import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface ReportHistoryItem {
  id: string;
  tenantId: string;
  requestedById: string;
  reportType: string;
  format: string;
  filters?: Record<string, any>;
  minioBucket: string;
  minioKey: string;
  fileSize?: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export interface ReportDefinition {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: string;
  config?: Record<string, any>;
  format: string;
  schedule?: string;
  recipients: string[];
  enabled: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface ExportRequest {
  reportType: string;
  format: string;
  dateFrom?: string;
  dateTo?: string;
  filters?: Record<string, any>;
}

interface ExportResponse {
  taskId: string;
  status: string;
  warning?: string;
}

interface CreateDefinitionInput {
  name: string;
  type: string;
  format?: string;
  schedule?: string;
  recipients?: string[];
  config?: Record<string, any>;
}

export function useRequestExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExportRequest) => {
      const res = await api.post('/reports/exports/request', input);
      return res.data as ExportResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'exports'] });
    },
  });
}

export function useExportStatus(taskId: string | null) {
  return useQuery({
    queryKey: ['reports', 'exports', taskId],
    queryFn: async () => {
      const res = await api.get(`/reports/exports/${taskId}/status`);
      return res.data as { status: string; downloadUrl?: string; fileSize?: number; expiresAt?: string; errorMessage?: string };
    },
    enabled: !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'completed' || data?.status === 'failed' || data?.status === 'not_found') return false;
      return 2000;
    },
  });
}

export function useHistory() {
  return useQuery<ReportHistoryItem[]>({
    queryKey: ['reports', 'history'],
    queryFn: async () => {
      const res = await api.get('/reports/history');
      return res.data;
    },
  });
}

export function useDownloadHistory() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get(`/reports/history/${id}/download`);
      return res.data as { downloadUrl: string };
    },
  });
}

export function useDeleteHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/reports/history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'history'] });
    },
  });
}

export function useDefinitions() {
  return useQuery<ReportDefinition[]>({
    queryKey: ['reports', 'definitions'],
    queryFn: async () => {
      const res = await api.get('/reports/definitions');
      return res.data;
    },
  });
}

export function useCreateDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDefinitionInput) => {
      const res = await api.post('/reports/definitions', input);
      return res.data as ReportDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'definitions'] });
    },
  });
}

export function useUpdateDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CreateDefinitionInput>) => {
      const res = await api.patch(`/reports/definitions/${id}`, input);
      return res.data as ReportDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'definitions'] });
    },
  });
}

export function useDeleteDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/reports/definitions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'definitions'] });
    },
  });
}

export function useExecuteDefinition() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/reports/definitions/${id}/execute`);
      return res.data as { taskId: string; status: string };
    },
  });
}

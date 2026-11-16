import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useCreateCategory } from '@/modules/inventory/hooks/useCreateCategory';
import { useUpdateCategory } from '@/modules/inventory/hooks/useUpdateCategory';
import { useDeleteCategory } from '@/modules/inventory/hooks/useDeleteCategory';

vi.mock('@/shared/lib/api/client', () => ({ default: { post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('category mutations', () => {
  it.each([
    ['create', useCreateCategory, () => api.post, { name: 'Herramientas' }],
    ['update', useUpdateCategory, () => api.patch, { id: 'cat-1', name: 'Herramientas', parentId: null }],
    ['delete', useDeleteCategory, () => api.delete, 'cat-1'],
  ] as const)('invalidates catalog, products and summaries after %s', async (_label, hook, request, payload) => {
    vi.mocked(request()).mockResolvedValue({ data: {} });
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => hook(), { wrapper });
    await act(() => result.current.mutateAsync(payload as never));
    for (const key of ['categories', 'inventory', 'product']) {
      expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: [key] }));
    }
  });
});

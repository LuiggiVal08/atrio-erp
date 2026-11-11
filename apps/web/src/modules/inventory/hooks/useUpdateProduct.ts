import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; barcode?: string | null; name?: string; description?: string; categoryId?: string; unitPrice?: number; costPrice?: number; taxId?: string; isService?: boolean; isActive?: boolean; imageUrl?: string }) => {
      const res = await api.patch(`/inventory/products/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.id] });
    },
  });
}

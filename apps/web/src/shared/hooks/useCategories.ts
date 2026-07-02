import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/inventory/categories');
      return res.data;
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useEmployeeStore } from '../store/employee-store';

export function useEmployees() {
  const { addEmployee } = useEmployeeStore();

  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/tenants/current/employees');
      const data = res.data;
      if (Array.isArray(data)) data.forEach((emp: any) => addEmployee(emp));
      return data;
    },
  });
}

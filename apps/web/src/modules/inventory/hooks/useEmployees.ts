import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

function useTenantId() {
  return useTenantStore.getState().activeTenantId;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Position {
  id: string;
  name: string;
  departmentId?: string;
  code?: string;
  description?: string;
  active: boolean;
}

export interface Employee {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  secondLastName?: string;
  identityDoc: string;
  identificationType?: string;
  taxIdentifier?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  hireDate: string;
  department: string;
  departmentId?: string;
  position: string;
  baseSalary: number;
  status: string;
  createdAt: string;
}

export interface EmployeePaymentDetails {
  id: string;
  employeeId: string;
  method: 'BANK' | 'MOBILE_PAYMENT';
  bankName: string | null;
  accountType: 'SAVINGS' | 'CHECKING' | 'OTHER' | null;
  accountNumber: string | null;
  mobilePaymentPhone?: string | null;
  effectiveFrom: string;
}

export function useEmployeePaymentDetails(employeeId: string) {
  return useQuery<EmployeePaymentDetails | null>({
    queryKey: ['employee-payment-details', employeeId],
    queryFn: async () => (await api.get(`/employees/${employeeId}/payment-details`)).data,
    enabled: !!employeeId,
    retry: false,
  });
}

export function useSaveEmployeePaymentDetails(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      method: EmployeePaymentDetails['method'];
      bankName?: string;
      accountType?: Exclude<EmployeePaymentDetails['accountType'], null>;
      accountNumber?: string;
      mobilePaymentPhone?: string;
    }) => (await api.put(`/employees/${employeeId}/payment-details`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['employee-payment-details', employeeId],
    }),
  });
}

export function useClearEmployeePaymentDetails(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => api.delete(`/employees/${employeeId}/payment-details`),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['employee-payment-details', employeeId],
    }),
  });
}

export function useEmployees() {
  const tenantId = useTenantId();
  return useQuery<Employee[]>({
    queryKey: ['employees', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/employees`);
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useEmployee(id: string) {
  return useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await api.get(`/employees/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useDepartments() {
  const tenantId = useTenantId();
  return useQuery<Department[]>({
    queryKey: ['departments', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/departments`);
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await api.post(`/tenants/${tenantId}/departments`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function usePositions() {
  const tenantId = useTenantId();
  return useQuery<Position[]>({
    queryKey: ['positions', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/positions`);
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async (data: { name: string; departmentId?: string; code?: string }) => {
      const res = await api.post(`/tenants/${tenantId}/positions`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async (data: {
      firstName: string; middleName?: string; lastName: string;
      secondLastName?: string; identityDoc: string; identificationType?: string;
      taxIdentifier?: string; phone?: string; email?: string; address?: string;
      emergencyContactName?: string; emergencyContactPhone?: string; hireDate: string;
      department: string; departmentId?: string; position: string; baseSalary: number;
    }) => {
      const res = await api.post(`/tenants/${tenantId}/employees`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      firstName?: string; middleName?: string; lastName?: string;
      secondLastName?: string; identityDoc?: string; identificationType?: string;
      taxIdentifier?: string; phone?: string; email?: string; address?: string;
      emergencyContactName?: string; emergencyContactPhone?: string; hireDate?: string;
      department?: string; position?: string; baseSalary?: number;
    }) => {
      const res = await api.patch(`/employees/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenantId: tId, id }: { tenantId: string; id: string }) => {
      await api.delete(`/tenants/${tId}/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

interface SetupEmployeeData {
  department: { name: string; description?: string };
  position: { name: string; code?: string };
  employee: {
    firstName: string; middleName?: string; lastName: string;
    secondLastName?: string; identityDoc: string; identificationType?: string;
    taxIdentifier?: string; phone?: string; email?: string; address?: string;
    emergencyContactName?: string; emergencyContactPhone?: string; hireDate: string;
    baseSalary: number;
  };
  employment: { startDate: string; reason: string };
  contract: { contractType: string; startDate: string };
  compensation: {
    effectiveDate: string; currency?: string;
    components: { type: string; amount: number }[];
  };
}

export function useSetupEmployee() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  return useMutation({
    mutationFn: async (data: SetupEmployeeData) => {
      // 1. Create department
      const deptRes = await api.post(`/tenants/${tenantId}/departments`, data.department);

      // 2. Create position
      const posRes = await api.post(`/tenants/${tenantId}/positions`, {
        ...data.position,
        departmentId: deptRes.data.id,
      });

      // 3. Create employee
      const empRes = await api.post(`/tenants/${tenantId}/employees`, {
        ...data.employee,
        department: data.department.name,
        departmentId: deptRes.data.id,
        position: data.position.name,
      });

      // 4. Create position assignment
      await api.post(`/tenants/${tenantId}/assignments`, {
        employeeId: empRes.data.id,
        positionId: posRes.data.id,
        startDate: data.employment.startDate,
      });

      // 5. Create employment relationship
      const relRes = await api.post(`/tenants/${tenantId}/employment-relationships`, {
        employeeId: empRes.data.id,
        startDate: data.employment.startDate,
        reason: data.employment.reason,
      });

      // 6. Create contract
      await api.post(
        `/employment-relationships/${relRes.data.id}/contracts`,
        data.contract,
      );

      // 7. Create compensation
      await api.post(
        `/employment-relationships/${relRes.data.id}/compensation`,
        data.compensation,
      );

      return { employee: empRes.data, relationshipId: relRes.data.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
  });
}

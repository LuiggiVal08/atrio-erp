import { create } from 'zustand';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId: string;
  isActive: boolean;
}

interface EmployeeState {
  employees: Employee[];
  branchFilter: string | null;
  filteredEmployees: Employee[];
  addEmployee: (emp: Employee) => void;
  assignRole: (id: string, role: string) => void;
  setBranchFilter: (branchId: string | null) => void;
  reset: () => void;
}

function computeFiltered(employees: Employee[], branchFilter: string | null): Employee[] {
  if (!branchFilter) return employees;
  return employees.filter((e) => e.branchId === branchFilter);
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  branchFilter: null,
  filteredEmployees: [],
  addEmployee: (emp) =>
    set((s) => {
      const employees = [...s.employees, emp];
      return { employees, filteredEmployees: computeFiltered(employees, s.branchFilter) };
    }),
  assignRole: (id, role) =>
    set((s) => {
      const employees = s.employees.map((e) => (e.id === id ? { ...e, role } : e));
      return { employees, filteredEmployees: computeFiltered(employees, s.branchFilter) };
    }),
  setBranchFilter: (branchId) =>
    set((s) => ({
      branchFilter: branchId,
      filteredEmployees: computeFiltered(s.employees, branchId),
    })),
  reset: () => set({ employees: [], branchFilter: null, filteredEmployees: [] }),
}));

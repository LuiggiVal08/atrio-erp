import { describe, it, expect, beforeEach } from 'vitest';
import { useEmployeeStore } from '@/modules/inventory/store/employee-store';

describe('employee store', () => {
  beforeEach(() => {
    useEmployeeStore.getState().reset();
  });

  it('creates an employee', () => {
    useEmployeeStore.getState().addEmployee({
      id: 'emp-1',
      name: 'Juan Pérez',
      email: 'juan@atrio.com',
      role: 'cashier',
      branchId: 'branch-1',
      isActive: true,
    });
    const { employees } = useEmployeeStore.getState();
    expect(employees).toHaveLength(1);
    expect(employees[0].name).toBe('Juan Pérez');
  });

  it('assigns a role to an employee', () => {
    useEmployeeStore.getState().addEmployee({
      id: 'emp-1', name: 'Juan Pérez', email: 'juan@atrio.com',
      role: 'cashier', branchId: 'branch-1', isActive: true,
    });
    useEmployeeStore.getState().assignRole('emp-1', 'supervisor');
    const emp = useEmployeeStore.getState().employees.find((e) => e.id === 'emp-1');
    expect(emp?.role).toBe('supervisor');
  });

  it('filters employees by branch', () => {
    useEmployeeStore.getState().addEmployee({
      id: 'emp-1', name: 'Juan', email: 'juan@atrio.com',
      role: 'cashier', branchId: 'branch-1', isActive: true,
    });
    useEmployeeStore.getState().addEmployee({
      id: 'emp-2', name: 'María', email: 'maria@atrio.com',
      role: 'supervisor', branchId: 'branch-2', isActive: true,
    });
    useEmployeeStore.getState().addEmployee({
      id: 'emp-3', name: 'Pedro', email: 'pedro@atrio.com',
      role: 'cashier', branchId: 'branch-1', isActive: true,
    });

    useEmployeeStore.getState().setBranchFilter('branch-1');
    const filtered = useEmployeeStore.getState().filteredEmployees;
    expect(filtered).toHaveLength(2);
    expect(filtered.every((e) => e.branchId === 'branch-1')).toBe(true);
  });
});

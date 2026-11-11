import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'hr.employees': 'Empleados',
        'hr.sections': 'Secciones de empleados',
        'hr.departments': 'Departamentos',
        'payroll.tabs.concepts': 'Conceptos',
        'payroll.tabs.process': 'Procesar nómina',
        'payroll.tabs.history': 'Historial',
        'payroll.tabs.loans': 'Préstamos',
      };
      return translations[key] ?? key;
    },
  }),
}));

import { EmployeeWorkspaceLayout } from '@/modules/inventory/views/EmployeeWorkspaceLayout';

describe('EmployeeWorkspaceLayout', () => {
  it('keeps HR sections inside the employee workspace', () => {
    render(
      <MemoryRouter initialEntries={['/employees']}>
        <EmployeeWorkspaceLayout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Secciones de empleados' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Empleados' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Departamentos' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Conceptos' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Procesar nómina' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Historial' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Préstamos' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Empleados' }).getAttribute('href')).toBe('/employees');
    expect(screen.getByRole('link', { name: 'Departamentos' }).getAttribute('href')).toBe('/employees/departments');
  });
});

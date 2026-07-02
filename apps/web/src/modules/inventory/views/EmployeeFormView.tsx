import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useEmployeeStore } from '../store/employee-store';
import { useNavigate, useParams } from 'react-router-dom';
import { useKeyboardNav } from '@/core/hooks/useKeyboardNav';

const roles = [
  { id: 'admin', label: 'Administrador' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'cashier', label: 'Cajero' },
  { id: 'auditor', label: 'Auditor' },
];

const branches = [
  { id: 'branch-1', label: 'Sucursal Centro' },
  { id: 'branch-2', label: 'Sucursal Este' },
];

export function EmployeeFormView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { employees, addEmployee, assignRole } = useEmployeeStore();

  const existing = id && id !== 'new' ? employees.find((e) => e.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [role, setRole] = useState(existing?.role ?? 'cashier');
  const [branchId, setBranchId] = useState(existing?.branchId ?? 'branch-1');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) return;

    if (existing) {
      assignRole(existing.id, role);
    } else {
      addEmployee({
        id: crypto.randomUUID?.() ?? `${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role,
        branchId,
        isActive,
      });
    }
    navigate('/inventory/employees');
  };

  const { handleKeyDown } = useKeyboardNav({ onSave: handleSave, onCancel: () => navigate('/inventory/employees') });

  return (
    <div className="mx-auto max-w-2xl p-6" onKeyDown={handleKeyDown}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">
          {existing ? t('hr.employee.edit') : t('hr.employee.create')}
        </h1>
        <button
          onClick={() => navigate('/inventory/employees')}
          className="rounded-lg border border-border px-4 py-1.5 text-xs text-text-secondary hover:bg-surface-hover"
        >
          {t('common.cancel')}
        </button>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">{t('hr.employee.name')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">{t('hr.employee.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">{t('hr.employee.role')}</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">{t('hr.employee.branch')}</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label htmlFor="isActive" className="text-sm text-text-primary">{t('hr.employee.active')}</label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleSave}
            className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

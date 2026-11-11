import { useState, useEffect } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckSquare, Square } from 'lucide-react';
import { useRoles, useCreateRole, useUpdateRole } from '../hooks/useRoles';
import { usePermissions } from '../hooks/usePermissions';

export function RoleFormView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';

  const { data: roles = [] } = useRoles();
  const { data: permissions = [] } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const existing = isEditing ? roles.find((r) => r.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description ?? '');
      setSelectedPermissions(new Set(existing.permissions?.map((rp) => rp.permission.id) ?? []));
    }
  }, [existing]);

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const permissionIds = Array.from(selectedPermissions);
    if (isEditing && existing) {
      updateRole.mutate(
        { id: existing.id, name: name.trim(), description: description.trim() || undefined, permissionIds },
        { onSuccess: () => navigate('/rbac') },
      );
    } else {
      createRole.mutate(
        { name: name.trim(), description: description.trim() || undefined, permissionIds },
        { onSuccess: () => navigate('/rbac') },
      );
    }
  };

  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const inputClass = 'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none';

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">
          {isEditing ? t('rbac.role.edit') : t('rbac.role.create')}
        </h1>
        <button
          onClick={() => navigate('/rbac')}
          className="rounded-lg border border-border px-4 py-1.5 text-xs text-text-secondary hover:bg-surface-hover"
        >
          {t('common.cancel')}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6 rounded-lg border border-border bg-surface p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">{t('rbac.role.name')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder={t('rbac.role.name')}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">{t('rbac.role.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder={t('rbac.role.description')}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">{t('rbac.permissions')}</label>
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border bg-canvas p-3">
              {Object.entries(grouped).map(([module, perms]) => (
                <div key={module} className="mb-4 last:mb-0">
                  <h3 className="mb-2 text-xs font-semibold uppercase text-text-secondary">
                    {module}
                  </h3>
                  <div className="grid grid-cols-2 gap-1">
                    {perms.map((perm) => {
                      const isSelected = selectedPermissions.has(perm.id);
                      return (
                        <button
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-accent/10 text-accent'
                              : 'text-text-secondary hover:bg-bg'
                          }`}
                        >
                          {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                          <span>{perm.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={createRole.isPending || updateRole.isPending || !name.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

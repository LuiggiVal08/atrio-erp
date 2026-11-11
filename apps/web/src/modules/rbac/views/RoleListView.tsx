import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Shield } from 'lucide-react';
import { useRoles, useDeleteRole } from '../hooks/useRoles';

export function RoleListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: roles = [], isLoading } = useRoles();
  const deleteRole = useDeleteRole();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('rbac.roles')}</h1>
        <button
          onClick={() => navigate('/rbac/new')}
          className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
        >
          {t('rbac.role.create')}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-text-secondary">
                <th className="px-4 py-3">{t('rbac.role.name')}</th>
                <th className="px-4 py-3">{t('rbac.role.description')}</th>
                <th className="px-4 py-3">{t('rbac.permissions')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                    {t('rbac.role.noRoles')}
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="border-b border-border last:border-b-0 hover:bg-bg/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-accent" />
                        <span className="text-text-primary">{role.name}</span>
                        {role.isSystem && (
                          <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                            {t('rbac.role.isSystem')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {role.description || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-secondary">
                        {role.permissions?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/rbac/${role.id}/edit`)}
                          className="rounded p-1 text-text-secondary hover:bg-bg"
                          title={t('common.edit')}
                        >
                          <Pencil size={16} />
                        </button>
                        {!role.isSystem && (
                          <button
                            onClick={() => {
                              if (confirm(t('rbac.role.confirmDelete'))) {
                                deleteRole.mutate(role.id);
                              }
                            }}
                            disabled={deleteRole.isPending}
                            className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-50"
                            title={t('common.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

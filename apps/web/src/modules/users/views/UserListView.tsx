import { useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useUsers, useDeleteUser } from '../hooks/useUsers';

export function UserListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState('');

  const displayed = search
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

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
        <h1 className="text-lg font-bold text-text-primary">{t('users.title')}</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
          <button
            onClick={() => navigate('/users/new')}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
          >
            {t('users.create')}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-text-secondary">
                <th className="px-4 py-3">{t('users.name')}</th>
                <th className="px-4 py-3">{t('users.email')}</th>
                <th className="px-4 py-3">{t('users.roles')}</th>
                <th className="px-4 py-3">{t('users.status')}</th>
                <th className="px-4 py-3">{t('users.lastLogin')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    {t('users.noUsers')}
                  </td>
                </tr>
              ) : (
                displayed.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-bg/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-text-primary">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.length > 0 ? (
                          user.roles.map((ur) => (
                            <span
                              key={ur.role.id}
                              className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
                            >
                              {ur.role.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-text-secondary">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${user.status === 'active' ? 'text-emerald-500' : 'text-text-secondary'}`}>
                        {user.status === 'active' ? t('users.active') : t('users.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(t('users.confirmDelete'))) {
                            deleteUser.mutate(user.id);
                          }
                        }}
                        disabled={deleteUser.isPending}
                        className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
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

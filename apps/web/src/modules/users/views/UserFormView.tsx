import { useState, useEffect } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckSquare, Square } from 'lucide-react';
import { useCreateUser } from '../hooks/useUsers';
import { useRoles, useAssignRoles } from '@/modules/rbac/hooks/useRoles';
import { useUsers } from '../hooks/useUsers';

export function UserFormView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';

  const { data: users = [] } = useUsers();
  const { data: roles = [] } = useRoles();
  const createUser = useCreateUser();
  const assignRoles = useAssignRoles();

  const existing = isEditing ? users.find((u) => u.id === id) : undefined;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setEmail(existing.email);
      setPhone(existing.phone ?? '');
      setSelectedRoleIds(new Set(existing.roles?.map((ur) => ur.role.id) ?? []));
    }
  }, [existing]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) return;
    if (isEditing && existing) {
      const roleIds = Array.from(selectedRoleIds);
      assignRoles.mutate(
        { userId: existing.id, roleIds },
        { onSuccess: () => navigate('/users') },
      );
    } else {
      if (!password.trim()) return;
      createUser.mutate(
        {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() || undefined,
        },
        {
          onSuccess: async (newUser) => {
            const roleIds = Array.from(selectedRoleIds);
            if (roleIds.length > 0) {
              await assignRoles.mutateAsync({ userId: newUser.id, roleIds });
            }
            navigate('/users');
          },
        },
      );
    }
  };

  const inputClass = 'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none';

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">
          {isEditing ? t('users.edit') : t('users.create')}
        </h1>
        <button
          onClick={() => navigate('/users')}
          className="rounded-lg border border-border px-4 py-1.5 text-xs text-text-secondary hover:bg-surface-hover"
        >
          {t('common.cancel')}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">{t('users.name')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder={t('users.name')}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">{t('users.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder={t('users.email')}
            />
          </div>
          {!isEditing && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">{t('users.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder={t('users.password')}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">{t('users.phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder={t('users.phone')}
            />
          </div>
          {roles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">{t('users.roles')}</label>
              <div className="rounded-lg border border-border bg-canvas p-3">
                <div className="grid grid-cols-2 gap-1">
                  {roles.map((role) => {
                    const isSelected = selectedRoleIds.has(role.id);
                    return (
                      <button
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-secondary hover:bg-bg'
                        }`}
                      >
                        {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                        <span>{role.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={
                createUser.isPending ||
                assignRoles.isPending ||
                !name.trim() ||
                !email.trim() ||
                (!isEditing && !password.trim())
              }
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

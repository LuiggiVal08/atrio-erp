import { useState, useEffect } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { CheckSquare, Square } from 'lucide-react';
import { applyServerErrors, resolveServerErrorMessage, FormInput } from '@/shared/form';
import { roleFormSchema, type RoleFormValues } from '@/shared/validation/role';
import { useRoles, useCreateRole, useUpdateRole } from '../hooks/useRoles';
import { usePermissions } from '../hooks/usePermissions';

const defaultValues: RoleFormValues = {
  name: '',
  description: '',
  permissionIds: [],
};

export function RoleFormView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';

  const { data: roles = [] } = useRoles();
  const { data: permissions = [] } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const [serverError, setServerError] = useState('');

  const existing = isEditing ? roles.find((r) => r.id === id) : undefined;

  const form = useForm({
    defaultValues,
    validators: { onSubmit: roleFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        if (isEditing && existing) {
          await updateRole.mutateAsync({
            id: existing.id,
            name: value.name.trim(),
            description: value.description.trim() || undefined,
            permissionIds: value.permissionIds,
          });
        } else {
          await createRole.mutateAsync({
            name: value.name.trim(),
            description: value.description.trim() || undefined,
            permissionIds: value.permissionIds,
          });
        }
        form.reset();
        navigate('/rbac');
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      name: existing.name,
      description: existing.description ?? '',
      permissionIds: existing.permissions?.map((rp) => rp.permission.id) ?? [],
    });
  }, [existing]);

  const togglePermission = (permId: string) => {
    const current = form.getFieldValue('permissionIds');
    form.setFieldValue(
      'permissionIds',
      current.includes(permId)
        ? current.filter((currentId) => currentId !== permId)
        : [...current, permId],
    );
  };

  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-6 rounded-lg border border-border bg-surface p-6"
        >
          <FormInput
            form={form}
            name="name"
            label={t('rbac.role.name')}
            placeholder={t('rbac.role.name')}
            required
          />
          <FormInput
            form={form}
            name="description"
            label={t('rbac.role.description')}
            placeholder={t('rbac.role.description')}
            multiline
            rows={3}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">{t('rbac.permissions')}</label>
            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border bg-canvas p-3">
              <form.Subscribe selector={(state) => state.values.permissionIds}>
                {(permissionIds) =>
                  Object.entries(grouped).map(([module, perms]) => (
                    <div key={module} className="mb-4 last:mb-0">
                      <h3 className="mb-2 text-xs font-semibold uppercase text-text-secondary">
                        {module}
                      </h3>
                      <div className="grid grid-cols-2 gap-1">
                        {perms.map((perm) => {
                          const isSelected = permissionIds.includes(perm.id);
                          return (
                            <button
                              key={perm.id}
                              type="button"
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
                  ))
                }
              </form.Subscribe>
            </div>
          </div>
          {serverError && (
            <p role="alert" className="text-xs text-red-500">
              {serverError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <form.Subscribe selector={(state) => state.values.name}>
              {(name) => (
                <button
                  type="submit"
                  disabled={createRole.isPending || updateRole.isPending || !name.trim()}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
}

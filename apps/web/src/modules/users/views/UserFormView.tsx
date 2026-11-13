import { useState, useEffect } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { CheckSquare, Square } from 'lucide-react';
import { applyServerErrors, resolveServerErrorMessage, FormInput } from '@/shared/form';
import {
  userEditFormSchema,
  userFormSchema,
  type UserFormValues,
} from '@/shared/validation/user';
import { useCreateUser } from '../hooks/useUsers';
import { useRoles, useAssignRoles } from '@/modules/rbac/hooks/useRoles';
import { useUsers } from '../hooks/useUsers';

const defaultValues: UserFormValues = {
  name: '',
  email: '',
  password: '',
  phone: '',
  roleIds: [],
};

export function UserFormView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';

  const { data: users = [] } = useUsers();
  const { data: roles = [] } = useRoles();
  const createUser = useCreateUser();
  const assignRoles = useAssignRoles();
  const [serverError, setServerError] = useState('');

  const existing = isEditing ? users.find((u) => u.id === id) : undefined;

  const form = useForm({
    defaultValues,
    validators: { onSubmit: isEditing ? userEditFormSchema : userFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        if (isEditing && existing) {
          await assignRoles.mutateAsync({
            userId: existing.id,
            roleIds: value.roleIds,
          });
        } else {
          const newUser = await createUser.mutateAsync({
            name: value.name.trim(),
            email: value.email.trim(),
            password: value.password.trim(),
            phone: value.phone.trim() || undefined,
          });
          if (value.roleIds.length > 0) {
            await assignRoles.mutateAsync({ userId: newUser.id, roleIds: value.roleIds });
          }
        }
        form.reset();
        navigate('/users');
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
      email: existing.email,
      password: '',
      phone: existing.phone ?? '',
      roleIds: existing.roles?.map((ur) => ur.role.id) ?? [],
    });
  }, [existing]);

  const toggleRole = (roleId: string) => {
    const current = form.getFieldValue('roleIds');
    form.setFieldValue(
      'roleIds',
      current.includes(roleId)
        ? current.filter((currentId) => currentId !== roleId)
        : [...current, roleId],
    );
  };

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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4 rounded-lg border border-border bg-surface p-6"
        >
          <FormInput
            form={form}
            name="name"
            label={t('users.name')}
            placeholder={t('users.name')}
            required
          />
          <FormInput
            form={form}
            name="email"
            label={t('users.email')}
            placeholder={t('users.email')}
            type="email"
            required
          />
          {!isEditing && (
            <FormInput
              form={form}
              name="password"
              label={t('users.password')}
              placeholder={t('users.password')}
              type="password"
              required
            />
          )}
          <FormInput
            form={form}
            name="phone"
            label={t('users.phone')}
            placeholder={t('users.phone')}
            type="tel"
          />
          {roles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">{t('users.roles')}</label>
              <div className="rounded-lg border border-border bg-canvas p-3">
                <form.Subscribe selector={(state) => state.values.roleIds}>
                  {(roleIds) => (
                    <div className="grid grid-cols-2 gap-1">
                      {roles.map((role) => {
                        const isSelected = roleIds.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            type="button"
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
                  )}
                </form.Subscribe>
              </div>
            </div>
          )}
          {serverError && (
            <p role="alert" className="text-xs text-red-500">
              {serverError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <form.Subscribe
              selector={(state) => ({
                name: state.values.name,
                email: state.values.email,
                password: state.values.password,
              })}
            >
              {({ name, email, password }) => (
                <button
                  type="submit"
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
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
}

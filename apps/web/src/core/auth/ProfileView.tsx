import { useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
  User, Camera, Mail, Globe, Building2, Shield, Phone,
  LockKeyhole, Briefcase, ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import {
  applyServerErrors,
  clearServerErrors,
  resolveServerErrorMessage,
  FormInput,
  FormSelect,
} from '@/shared/form';
import {
  passwordChangeSchema,
  profileInfoSchema,
  securityQuestionsSchema,
  type ProfileInfoValues,
  type SecurityQuestionsValues,
} from '@/shared/validation/profile';
import { useAuthStore } from './store';

const SECURITY_QUESTIONS = [
  '¿Cuál fue el nombre de tu primera mascota?',
  '¿Cuál fue tu primera escuela?',
  '¿Cuál es el nombre de tu ciudad de nacimiento?',
  '¿Cuál es el segundo nombre de tu madre?',
  '¿Cuál fue el modelo de tu primer vehículo?',
  '¿Cuál fue el nombre de tu mejor amigo de infancia?',
];

const securityQuestionOptions = SECURITY_QUESTIONS.map((question) => ({
  value: question,
  label: question,
}));

const defaultSecurityAnswers: SecurityQuestionsValues['answers'] = [
  { position: 1, question: '', answer: '' },
  { position: 2, question: '', answer: '' },
  { position: 3, question: '', answer: '' },
];

export function ProfileView() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');

  const profileForm = useForm({
    defaultValues: {
      name: user?.name ?? '',
      locale: user?.locale ?? 'es',
      phone: user?.phone ?? '',
      employeeId: null as string | null,
    } satisfies ProfileInfoValues,
    validators: { onSubmit: profileInfoSchema },
    onSubmit: async ({ value }) => {
      setProfileError('');
      try {
        const res = await api.patch('/users/me', {
          name: value.name.trim(),
          locale: value.locale,
          phone: value.phone.trim() || undefined,
          employeeId: value.employeeId || null,
        });
        setUser({ name: res.data.name, locale: res.data.locale, phone: res.data.phone });
        clearServerErrors(profileForm);
        profileForm.reset({
          name: res.data.name ?? value.name.trim(),
          locale: res.data.locale ?? value.locale,
          phone: res.data.phone ?? '',
          employeeId: value.employeeId,
        });
      } catch (error) {
        const result = applyServerErrors(profileForm, error);
        setProfileError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validators: { onSubmit: passwordChangeSchema },
    onSubmit: async ({ value }) => {
      setPasswordMessage('');
      try {
        await api.patch('/users/me/password', {
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });
        clearServerErrors(passwordForm);
        passwordForm.reset();
        setPasswordMessage('Contraseña actualizada correctamente');
      } catch (error) {
        const result = applyServerErrors(passwordForm, error);
        setPasswordMessage(
          resolveServerErrorMessage(result, 'No se pudo cambiar la contraseña'),
        );
      }
    },
  });

  const securityForm = useForm({
    defaultValues: { answers: defaultSecurityAnswers },
    validators: { onSubmit: securityQuestionsSchema },
    onSubmit: async ({ value }) => {
      setSecurityMessage('');
      try {
        await api.put('/users/me/security-questions', { answers: value.answers });
        clearServerErrors(securityForm);
        securityForm.reset({
          answers: value.answers.map((entry) => ({ ...entry, answer: '' })),
        });
        setSecurityMessage('Preguntas de seguridad actualizadas');
      } catch (error) {
        const result = applyServerErrors(securityForm, error);
        setSecurityMessage(
          resolveServerErrorMessage(result, 'No se pudieron guardar las preguntas'),
        );
      }
    },
  });

  const displayUrl = previewUrl ?? user?.imageUrl ?? null;

  useEffect(() => {
    const tenantId = useTenantStore.getState().activeTenantId;
    if (!tenantId) return;

    Promise.all([
      api.get('/users/me'),
      api.get(`/tenants/${tenantId}/employees`),
      api.get('/users/me/security-questions'),
    ]).then(([profileRes, employeesRes, securityRes]) => {
      const profile = profileRes.data;
      profileForm.reset({
        name: profile.name ?? '',
        locale: profile.locale ?? 'es',
        phone: profile.phone ?? '',
        employeeId: profile.employeeId ?? null,
      });
      setEmployees(employeesRes.data ?? []);

      const configured = securityRes.data?.questions ?? [];
      securityForm.reset({
        answers: defaultSecurityAnswers.map((item) => {
          const match = configured.find((entry: any) => entry.position === item.position);
          return { ...item, question: match?.question ?? '', answer: '' };
        }),
      });
    }).catch(() => {});
  }, [profileForm, securityForm]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/users/me/photo', formData);
      setUser({ imageUrl: res.data.imageUrl });
      setPreviewUrl(null);
    } catch {
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await api.delete('/users/me/photo');
      setUser({ imageUrl: null });
    } catch {}
  };

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('sidebar.profile.label')}</h1>
        <profileForm.Subscribe
          selector={(state) => ({ name: state.values.name, submitting: state.isSubmitting })}
        >
          {({ name, submitting }) => (
            <button
              type="submit"
              form="profile-info-form"
              disabled={submitting || !name.trim()}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {submitting ? t('common.loading') : t('common.save')}
            </button>
          )}
        </profileForm.Subscribe>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="group relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent ring-4 ring-accent/20">
                {displayUrl ? (
                  <img src={displayUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-canvas bg-accent text-white shadow-md hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            {displayUrl && (
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="text-xs text-text-secondary underline hover:text-error transition-colors"
              >
                Eliminar foto
              </button>
            )}
          </div>

          {/* Info */}
          <form
            id="profile-info-form"
            onSubmit={(event) => {
              event.preventDefault();
              void profileForm.handleSubmit();
            }}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <User size={13} />
                  {t('auth.name')}
                </div>
                <FormInput form={profileForm} name="name" ariaLabel={t('auth.name')} required />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Mail size={13} />
                  {t('auth.email')}
                </label>
                <p className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-muted">
                  {user?.email ?? '-'}
                </p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Globe size={13} />
                  {t('auth.locale')}
                </div>
                <FormSelect
                  form={profileForm}
                  name="locale"
                  ariaLabel={t('auth.locale')}
                  options={[
                    { value: 'es', label: 'Español' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Phone size={13} />
                  Teléfono
                </div>
                <FormInput
                  form={profileForm}
                  name="phone"
                  type="tel"
                  ariaLabel="Teléfono"
                  placeholder="+58 412 123 4567"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Briefcase size={13} />
                  Empleado vinculado
                </div>
                <FormSelect
                  form={profileForm}
                  name="employeeId"
                  ariaLabel="Empleado vinculado"
                  placeholder="Sin vínculo laboral"
                  options={employees.map((item) => ({
                    value: item.id,
                    label: `${[item.firstName, item.middleName, item.lastName, item.secondLastName].filter(Boolean).join(' ')} — ${item.position}`,
                  }))}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Shield size={13} />
                  ID
                </label>
                <p className="truncate rounded-lg border border-border bg-canvas px-3 py-2 text-sm font-mono text-text-muted">
                  {user?.id ?? '-'}
                </p>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Building2 size={13} />
                  Tenant
                </label>
                <p className="truncate rounded-lg border border-border bg-canvas px-3 py-2 text-sm font-mono text-text-muted">
                  {user?.tenantId ?? '-'}
                </p>
              </div>
            </div>
            {profileError && (
              <p role="alert" className="mt-4 text-xs text-red-500">
                {profileError}
              </p>
            )}
          </form>

          {/* Security */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void passwordForm.handleSubmit();
            }}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="mb-5 flex items-start gap-3">
              <LockKeyhole size={18} className="mt-0.5 text-accent" />
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Cambiar contraseña</h3>
                <p className="mt-0.5 text-xs text-text-secondary">
                  Usa al menos 8 caracteres y una contraseña que no hayas usado antes aquí.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormInput
                form={passwordForm}
                name="currentPassword"
                type="password"
                ariaLabel="Contraseña actual"
                placeholder="Contraseña actual"
                autoComplete="current-password"
                required
              />
              <FormInput
                form={passwordForm}
                name="newPassword"
                type="password"
                ariaLabel="Nueva contraseña"
                placeholder="Nueva contraseña"
                autoComplete="new-password"
                required
              />
              <FormInput
                form={passwordForm}
                name="confirmPassword"
                type="password"
                ariaLabel="Confirmar contraseña"
                placeholder="Confirmar contraseña"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <passwordForm.Subscribe
                selector={(state) => ({
                  submitting: state.isSubmitting,
                  current: state.values.currentPassword,
                  next: state.values.newPassword,
                  confirm: state.values.confirmPassword,
                })}
              >
                {({ submitting, current, next, confirm }) => (
                  <button
                    type="submit"
                    disabled={submitting || !current || !next || !confirm}
                    className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : 'Actualizar contraseña'}
                  </button>
                )}
              </passwordForm.Subscribe>
              {passwordMessage && (
                <span role="status" className="text-xs text-text-secondary">{passwordMessage}</span>
              )}
            </div>
          </form>

          {/* Security questions */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void securityForm.handleSubmit();
            }}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="mb-5 flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 text-accent" />
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Preguntas de seguridad</h3>
                <p className="mt-0.5 text-xs text-text-secondary">
                  Configura tres respuestas privadas para recuperar el acceso. Las respuestas se almacenan cifradas.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {defaultSecurityAnswers.map((item, index) => (
                <div key={item.position} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
                  <FormSelect
                    form={securityForm}
                    name={`answers[${index}].question`}
                    ariaLabel={`Pregunta de seguridad ${item.position}`}
                    placeholder="Selecciona una pregunta"
                    options={securityQuestionOptions}
                  />
                  <FormInput
                    form={securityForm}
                    name={`answers[${index}].answer`}
                    type="password"
                    ariaLabel={`Respuesta de seguridad ${item.position}`}
                    placeholder="Respuesta privada"
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <securityForm.Subscribe selector={(state) => state.isSubmitting}>
                {(submitting) => (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : 'Guardar preguntas'}
                  </button>
                )}
              </securityForm.Subscribe>
              {securityMessage && (
                <span role="status" className="text-xs text-text-secondary">{securityMessage}</span>
              )}
            </div>
          </form>

          {/* Danger zone */}
          <div className="rounded-xl border border-error/20 bg-error/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-error">{t('auth.logout')}</h3>
                <p className="mt-0.5 text-xs text-text-secondary">
                  Cierra sesión para cambiar de usuario o cuenta
                </p>
              </div>
              <button
                type="button"
                onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login'; }}
                className="rounded-lg border border-error px-4 py-1.5 text-xs font-semibold text-error hover:bg-error/10 transition-colors"
              >
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useAuthStore } from './store';
import {
  User, Camera, Mail, Globe, Building2, Shield, Phone,
  LockKeyhole, Briefcase, ShieldCheck,
} from 'lucide-react';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

const SECURITY_QUESTIONS = [
  '¿Cuál fue el nombre de tu primera mascota?',
  '¿Cuál fue tu primera escuela?',
  '¿Cuál es el nombre de tu ciudad de nacimiento?',
  '¿Cuál es el segundo nombre de tu madre?',
  '¿Cuál fue el modelo de tu primer vehículo?',
  '¿Cuál fue el nombre de tu mejor amigo de infancia?',
];

export function ProfileView() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [locale, setLocale] = useState(user?.locale ?? 'es');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [securityAnswers, setSecurityAnswers] = useState([
    { position: 1, question: '', answer: '' },
    { position: 2, question: '', answer: '' },
    { position: 3, question: '', answer: '' },
  ]);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');

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
      setName(profile.name ?? '');
      setLocale(profile.locale ?? 'es');
      setPhone(profile.phone ?? '');
      setEmployeeId(profile.employeeId ?? null);
      setEmployees(employeesRes.data ?? []);

      const configured = securityRes.data?.questions ?? [];
      if (configured.length > 0) {
        setSecurityAnswers((current) => current.map((item) => {
          const match = configured.find((entry: any) => entry.position === item.position);
          return match ? { ...item, question: match.question } : item;
        }));
      }
    }).catch(() => {});
  }, []);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/me', {
        name,
        locale,
        phone: phone || undefined,
        employeeId: employeeId || null,
      });
      setUser({ name: res.data.name, locale: res.data.locale, phone: res.data.phone });
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    if (newPassword.length < 8) {
      setPasswordMessage('La contraseña nueva debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('La confirmación de contraseña no coincide');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Contraseña actualizada correctamente');
    } catch (error: any) {
      setPasswordMessage(error?.response?.data?.message ?? 'No se pudo cambiar la contraseña');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveSecurityQuestions = async () => {
    setSecurityMessage('');
    if (securityAnswers.some((item) => !item.question || item.answer.trim().length < 2)) {
      setSecurityMessage('Completa las tres preguntas y respuestas');
      return;
    }
    if (new Set(securityAnswers.map((item) => item.question)).size !== 3) {
      setSecurityMessage('Selecciona tres preguntas diferentes');
      return;
    }

    setSecuritySaving(true);
    try {
      await api.put('/users/me/security-questions', { answers: securityAnswers });
      setSecurityAnswers((current) => current.map((item) => ({ ...item, answer: '' })));
      setSecurityMessage('Preguntas de seguridad actualizadas');
    } catch (error: any) {
      setSecurityMessage(error?.response?.data?.message ?? 'No se pudieron guardar las preguntas');
    } finally {
      setSecuritySaving(false);
    }
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
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
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
                onClick={handleDeletePhoto}
                className="text-xs text-text-secondary underline hover:text-error transition-colors"
              >
                Eliminar foto
              </button>
            )}
          </div>

          {/* Info */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <User size={13} />
                  {t('auth.name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none placeholder:text-text-secondary"
                />
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
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Globe size={13} />
                  {t('auth.locale')}
                </label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Phone size={13} />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+58 412 123 4567"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none placeholder:text-text-secondary"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Briefcase size={13} />
                  Empleado vinculado
                </label>
                <select
                  value={employeeId ?? ''}
                  onChange={(e) => setEmployeeId(e.target.value || null)}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="">Sin vínculo laboral</option>
                  {employees.map((item) => (
                    <option key={item.id} value={item.id}>
                      {[item.firstName, item.middleName, item.lastName, item.secondLastName].filter(Boolean).join(' ')} — {item.position}
                    </option>
                  ))}
                </select>
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
          </div>

          {/* Security */}
          <div className="rounded-xl border border-border bg-surface p-6">
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
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Contraseña actual"
                autoComplete="current-password"
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                autoComplete="new-password"
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                autoComplete="new-password"
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {passwordSaving ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
              {passwordMessage && (
                <span className="text-xs text-text-secondary">{passwordMessage}</span>
              )}
            </div>
          </div>

          {/* Security questions */}
          <div className="rounded-xl border border-border bg-surface p-6">
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
              {securityAnswers.map((item, index) => (
                <div key={item.position} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
                  <select
                    value={item.question}
                    onChange={(e) => setSecurityAnswers((current) => current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, question: e.target.value } : entry,
                    ))}
                    className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="">Selecciona una pregunta</option>
                    {SECURITY_QUESTIONS.map((question) => (
                      <option key={question} value={question}>{question}</option>
                    ))}
                  </select>
                  <input
                    type="password"
                    value={item.answer}
                    onChange={(e) => setSecurityAnswers((current) => current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, answer: e.target.value } : entry,
                    ))}
                    placeholder="Respuesta privada"
                    autoComplete="off"
                    className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSaveSecurityQuestions}
                disabled={securitySaving}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {securitySaving ? 'Guardando...' : 'Guardar preguntas'}
              </button>
              {securityMessage && (
                <span className="text-xs text-text-secondary">{securityMessage}</span>
              )}
            </div>
          </div>

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

import { useState, FormEvent, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { useTenantStore } from '@/core/tenant/store';
import { Logo } from '@/core/components/Logo';
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  Package,
  ShoppingCart,
  Wallet,
} from 'lucide-react';

type Step = 'tenant' | 'credentials';

export function LoginView() {
  const [step, setStep] = useState<Step>('tenant');
  const [tenant, setTenant] = useState(() => localStorage.getItem('atrio-last-tenant') ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ tenant?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [slugCheck, setSlugCheck] = useState<{ available: boolean; suggestion?: string } | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [locale, setLocale] = useState<'es' | 'en'>(() => {
    const stored = localStorage.getItem('atrio-locale');
    return stored === 'en' ? 'en' : 'es';
  });
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const checkRequestRef = useRef(0);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const checkSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugCheck(null);
      setSlugChecking(false);
      return;
    }
    const requestId = ++checkRequestRef.current;
    setSlugChecking(true);
    try {
      const res = await fetch(`/api/v1/admin/tenants/check-slug?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (requestId === checkRequestRef.current) setSlugCheck(data);
      } else if (requestId === checkRequestRef.current) {
        setSlugCheck(null);
        setError(locale === 'es'
          ? 'No se pudo validar la empresa. Comprueba tu conexión e inténtalo de nuevo.'
          : 'The company could not be verified. Check your connection and try again.');
      }
    } catch {
      if (requestId === checkRequestRef.current) {
        setSlugCheck(null);
        setError(locale === 'es' ? 'No se pudo validar la empresa. Inténtalo de nuevo.' : 'The company could not be verified. Try again.');
      }
    } finally {
      if (requestId === checkRequestRef.current) setSlugChecking(false);
    }
  }, [locale]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    checkRequestRef.current++;
    setSlugCheck(null);
    setError('');
    debounceRef.current = setTimeout(() => checkSlug(tenant), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [tenant, checkSlug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step === 'tenant') {
      if (!tenant.trim() || tenant.trim().length < 3) {
        const message = locale === 'es'
          ? 'Ingresa el identificador de tu empresa.'
          : 'Enter your company identifier.';
        setFieldErrors({ tenant: message });
        requestAnimationFrame(() => errorSummaryRef.current?.focus());
        return;
      }
      if (slugChecking || !slugCheck || slugCheck.available) return;
      localStorage.setItem('atrio-last-tenant', tenant.trim());
      setError('');
      setStep('credentials');
      return;
    }
    const nextFieldErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      nextFieldErrors.email = locale === 'es' ? 'Ingresa tu correo electrónico.' : 'Enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextFieldErrors.email = locale === 'es' ? 'Ingresa un correo válido.' : 'Enter a valid email address.';
    }
    if (!password) {
      nextFieldErrors.password = locale === 'es' ? 'Ingresa tu contraseña.' : 'Enter your password.';
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    setFieldErrors({});
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenant }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: locale === 'es' ? 'No se pudo iniciar sesión' : 'Sign in failed' }));
        throw new Error(err.message || (locale === 'es' ? 'No se pudo iniciar sesión' : 'Sign in failed'));
      }
      const data = await res.json();
      setAuth(data.accessToken, data.user);
      localStorage.setItem('x-tenant-id', data.user.tenantId);
      useTenantStore.getState().setActiveTenant(data.user.tenantId);
      navigate('/reports/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
    } finally {
      setLoading(false);
    }
  };

  const copy = locale === 'es'
    ? {
        company: 'Empresa',
        companyPlaceholder: 'Identificador o slug',
        companyFound: 'Empresa verificada',
        companyMissing: 'No encontramos esta empresa',
        checking: 'Verificando...',
        continue: 'Continuar',
        title: 'Iniciar sesión',
        credentialsTitle: 'Accede a tu cuenta',
        credentialsCopy: 'Ingresa tus credenciales para continuar.',
        tenantCopy: 'Primero selecciona el espacio de trabajo.',
        email: 'Correo electrónico',
        password: 'Contraseña',
        signin: 'Iniciar sesión',
        signing: 'Iniciando sesión...',
        different: 'Cambiar empresa',
        support: '¿Necesitas ayuda?',
      }
    : {
        company: 'Company',
        companyPlaceholder: 'Identifier or slug',
        companyFound: 'Company verified',
        companyMissing: 'We could not find this company',
        checking: 'Verifying...',
        continue: 'Continue',
        title: 'Sign in',
        credentialsTitle: 'Access your account',
        credentialsCopy: 'Enter your credentials to continue.',
        tenantCopy: 'Select your workspace first.',
        email: 'Email',
        password: 'Password',
        signin: 'Sign in',
        signing: 'Signing in...',
        different: 'Change company',
        support: 'Need help?',
      };
  const hasFieldErrors = Boolean(fieldErrors.tenant || fieldErrors.email || fieldErrors.password);

  const steps = locale === 'es' ? ['Empresa', 'Cuenta'] : ['Company', 'Account'];
  const workspaceLabel = tenant.trim() || (locale === 'es' ? 'Espacio operativo' : 'Workspace');
  const operationTitle = locale === 'es' ? 'Venta registrada' : 'Sale recorded';
  const operationStatus = locale === 'es' ? 'Completada' : 'Completed';

  return (
    <main className="min-h-dvh w-full overflow-y-auto bg-canvas text-text-primary">
      <div className="grid min-h-dvh md:grid-cols-[minmax(280px,0.9fr)_minmax(420px,560px)] lg:grid-cols-[minmax(420px,1fr)_520px]">
        <section
          className="relative hidden min-h-dvh flex-col overflow-hidden px-8 py-8 md:flex md:px-10 lg:px-14 lg:py-10"
          style={{
            backgroundImage:
              'linear-gradient(145deg, rgba(48,91,145,0.82) 0%, rgba(35,69,112,0.78) 48%, rgba(24,35,55,0.88) 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            aria-hidden="true"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
          <div
            className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-white/[0.06] blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 -right-24 size-[28rem] rounded-full bg-[#0D0F14]/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-[12%] top-[28%] size-40 rounded-3xl border border-white/15"
            aria-hidden="true"
          />

          <div className="pointer-events-none absolute left-0 top-0 h-full w-px bg-white/10" aria-hidden="true" />
          <Logo variant="logotipo" className="relative z-10 h-8 w-auto self-start" />

          <div className="relative z-10 flex flex-1 flex-col justify-center py-6">
            <div
              data-ui
              className="relative w-full max-w-[620px] self-center rounded-xl border border-border-light bg-canvas"
              aria-label={locale === 'es' ? 'Vista de operación integrada' : 'Integrated operation view'}
            >
              <div className="lg:grid lg:grid-cols-[56px_minmax(0,1fr)]">
                <aside className="hidden flex-col items-center bg-surface py-4 lg:flex" aria-label={locale === 'es' ? 'Módulos de Atrio' : 'Atrio modules'}>
                  <span className="mb-5 flex size-7 items-center justify-center rounded-md bg-accent text-white">
                    <Building2 size={15} aria-hidden="true" />
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-md bg-accent-alpha text-accent">
                    <ShoppingCart size={16} aria-hidden="true" />
                  </span>
                  <span className="mt-2 flex size-9 items-center justify-center rounded-md text-text-muted">
                    <Package size={16} aria-hidden="true" />
                  </span>
                  <span className="mt-2 flex size-9 items-center justify-center rounded-md text-text-muted">
                    <Wallet size={16} aria-hidden="true" />
                  </span>
                </aside>

                <div className="min-w-0">
              <div className="flex items-center justify-between bg-surface px-4 py-3 lg:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{workspaceLabel}</p>
                  <p className="mt-0.5 text-xs text-text-muted">Atrio ERP</p>
                </div>
                <span className="state-badge" data-state="posted">
                  {operationStatus}
                </span>
              </div>

              <div className="px-4 py-5 lg:px-5 lg:py-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent-alpha text-accent">
                    <ShoppingCart size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{operationTitle}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {locale === 'es'
                        ? 'La operación quedó registrada en el sistema.'
                        : 'The operation was recorded in the system.'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 lg:grid-cols-[1fr_1fr_1fr]">
                  <div className="flex items-center gap-3 rounded-lg bg-surface px-3 py-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
                      <ShoppingCart size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-text-secondary">
                        {locale === 'es' ? 'Venta' : 'Sales'}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-text-primary">
                        {locale === 'es' ? 'Confirmada' : 'Confirmed'}
                      </p>
                    </div>
                    <CheckCircle2 className="ml-auto shrink-0 text-success" size={15} aria-hidden="true" />
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-surface px-3 py-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
                      <Package size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-text-secondary">
                        {locale === 'es' ? 'Inventario' : 'Inventory'}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-text-primary">
                        {locale === 'es' ? 'Actualizado' : 'Updated'}
                      </p>
                    </div>
                    <CheckCircle2 className="ml-auto shrink-0 text-success" size={15} aria-hidden="true" />
                  </div>

                  <div className="flex items-center gap-3 rounded-lg bg-surface px-3 py-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                      <Wallet size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-text-secondary">
                        {locale === 'es' ? 'Caja' : 'Cash'}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-text-primary">
                        {locale === 'es' ? 'Conciliada' : 'Reconciled'}
                      </p>
                    </div>
                    <CheckCircle2 className="ml-auto shrink-0 text-success" size={15} aria-hidden="true" />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-4 text-sm font-medium text-white/75">
              {locale === 'es' ? 'Todo conectado' : 'Everything connected'}
            </p>
            <h2 className="max-w-[11ch] text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[0.94] tracking-[-0.045em] text-white">
              {locale === 'es' ? 'Tu operación, bajo control.' : 'Your operation, under control.'}
            </h2>
            <div className="mt-6 flex items-center gap-3 text-sm text-white/60">
              <span className="h-[3px] w-12 bg-white/70" aria-hidden="true" />
              <span>ODALX</span>
            </div>
          </div>
        </section>

        <section className="flex min-h-dvh items-center px-5 py-8 sm:px-8 md:px-10 lg:px-12">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mx-auto w-full max-w-[400px]"
            aria-busy={loading || slugChecking}
          >
            <div className="mb-10 flex items-center justify-between md:hidden">
              <Logo variant="logotipo" className="h-8 w-auto" />
              <button
                type="button"
                onClick={() => {
                  const next = locale === 'es' ? 'en' : 'es';
                  setLocale(next);
                  localStorage.setItem('atrio-locale', next);
                }}
                className="flex h-11 min-w-11 items-center justify-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
              >
                <Globe2 size={17} aria-hidden="true" />
                <span>{locale === 'es' ? 'ES' : 'EN'}</span>
              </button>
            </div>

            <div className="mb-10 hidden items-center justify-end md:flex">
              <button
                type="button"
                onClick={() => {
                  const next = locale === 'es' ? 'en' : 'es';
                  setLocale(next);
                  localStorage.setItem('atrio-locale', next);
                }}
                className="flex h-11 min-w-11 items-center justify-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
              >
                <Globe2 size={17} aria-hidden="true" />
                <span>{locale === 'es' ? 'ES' : 'EN'}</span>
              </button>
            </div>

            <nav aria-label={locale === 'es' ? 'Progreso de acceso' : 'Sign-in progress'} className="mb-9 flex items-center gap-5">
              {steps.map((label, index) => {
                const active = index === (step === 'tenant' ? 0 : 1);
                const complete = index === 0 && step === 'credentials';
                return (
                  <div key={label} className="relative flex items-center gap-2 pb-3">
                    <span className={`text-sm font-medium ${active || complete ? 'text-text-primary' : 'text-text-muted'}`}>
                      {label}
                    </span>
                    {active && <span className="absolute bottom-0 left-0 h-[3px] w-full bg-accent" aria-hidden="true" />}
                  </div>
                );
              })}
            </nav>

            {error && (
              <div
                ref={errorSummaryRef}
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
                className="mb-6 border-l-2 border-error bg-error/10 px-4 py-3 text-sm text-error focus:outline-none focus:ring-2 focus:ring-error/40"
              >
                {error}
              </div>
            )}
            {hasFieldErrors && (
              <div
                ref={errorSummaryRef}
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
                className="mb-6 border-l-2 border-error bg-error/10 px-4 py-3 text-sm text-error focus:outline-none focus:ring-2 focus:ring-error/40"
              >
                <p className="font-medium">{locale === 'es' ? 'Revisa estos campos:' : 'Review these fields:'}</p>
                <ul className="mt-1 space-y-1">
                  {Object.entries(fieldErrors).filter((entry): entry is [string, string] => typeof entry[1] === 'string').map(([field, message]) => (
                    <li key={field}>
                      <a href={`#${field}`} className="underline underline-offset-2 hover:no-underline">{message}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <header className="mb-8">
              <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] text-text-primary sm:text-[36px]">
                {step === 'tenant' ? copy.title : copy.credentialsTitle}
              </h1>
              <p className="mt-3 max-w-sm text-[15px] leading-6 text-text-secondary">
                {step === 'tenant' ? copy.tenantCopy : copy.credentialsCopy}
              </p>
            </header>

            {step === 'tenant' ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="tenant">
                    {copy.company}
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} aria-hidden="true" />
                    <input
                      id="tenant"
                      type="text"
                      value={tenant}
                      onChange={(e) => {
                        setTenant(e.target.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                        if (fieldErrors.tenant) setFieldErrors((current) => ({ ...current, tenant: undefined }));
                      }}
                      placeholder={copy.companyPlaceholder}
                      className="h-[48px] w-full rounded-lg border border-border-light bg-overlay pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                      required
                      autoComplete="organization"
                      autoFocus
                      aria-describedby="tenant-status"
                      aria-invalid={Boolean(fieldErrors.tenant)}
                    />
                  </div>
                  <div id="tenant-status" aria-live="polite" className="mt-2 min-h-5">
                    {fieldErrors.tenant && <p id="tenant-error" role="alert" className="text-xs text-error">{fieldErrors.tenant}</p>}
                    {slugChecking && tenant.length >= 3 && <p className="text-xs text-text-muted">{copy.checking}</p>}
                    {!slugChecking && slugCheck && (
                      <p className={`flex items-center gap-1.5 text-xs ${slugCheck.available ? 'text-error' : 'text-success'}`}>
                        {!slugCheck.available && <Check size={14} aria-hidden="true" />}
                        {slugCheck.available ? copy.companyMissing : copy.companyFound}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!tenant || tenant.length < 3 || slugChecking || !slugCheck || slugCheck.available}
                  className="mt-6 flex h-[48px] w-full items-center justify-between rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  <span>{copy.continue}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <div className="mb-5 flex min-h-12 items-center justify-between rounded-lg bg-overlay px-4">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-text-secondary">
                    <Building2 size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
                    <span className="truncate">{tenant}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFieldErrors({});
                      setStep('tenant');
                    }}
                    className="ml-3 min-h-11 text-xs font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {copy.different}
                  </button>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="email">{copy.email}</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
                    }}
                    className="h-[48px] w-full rounded-lg border border-border-light bg-overlay px-4 text-[15px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                    required
                    autoComplete="email"
                    autoFocus
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  />
                  {fieldErrors.email && <p id="email-error" role="alert" className="mt-2 text-xs text-error">{fieldErrors.email}</p>}
                </div>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="password">{copy.password}</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
                      }}
                      className="h-[48px] w-full rounded-lg border border-border-light bg-overlay px-4 pr-12 text-[15px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                      required
                      autoComplete="current-password"
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label={showPassword
                        ? (locale === 'es' ? 'Ocultar contraseña' : 'Hide password')
                        : (locale === 'es' ? 'Mostrar contraseña' : 'Show password')}
                    >
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p id="password-error" role="alert" className="mt-2 text-xs text-error">{fieldErrors.password}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[48px] w-full items-center justify-between rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  <span className="flex items-center gap-2">
                    <LockKeyhole size={17} aria-hidden="true" />
                    {loading ? copy.signing : copy.signin}
                  </span>
                  {!loading && <ArrowRight size={18} aria-hidden="true" />}
                </button>
              </>
            )}

            <footer className="mt-10">
              <a href="mailto:support@atrioerp.com" className="inline-flex min-h-11 items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <Mail size={15} aria-hidden="true" />
                {copy.support}
              </a>
            </footer>
          </form>
        </section>
      </div>
    </main>
  );
}

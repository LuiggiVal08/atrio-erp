import { useState, useEffect, useRef, useCallback } from 'react';
import { Logo } from '@/core/components/Logo';
import {
  ShoppingCart, Package, CreditCard, Globe,
  ArrowRight, Check, Send, Menu, X, Database, Zap, Shield,
  Layers, Server, Languages, ChevronDown, Sun, Moon,
} from 'lucide-react';

type NavLink = { labelKey: string; labelEs: string; labelEn: string; href: string };

const NAV_LINKS: NavLink[] = [
  { labelKey: 'modules', labelEs: 'Módulos', labelEn: 'Modules', href: '#modules' },
  { labelKey: 'plans', labelEs: 'Planes', labelEn: 'Plans', href: '#plans' },
  { labelKey: 'workflow', labelEs: 'Flujo', labelEn: 'Workflow', href: '#workflow' },
  { labelKey: 'platform', labelEs: 'Plataforma', labelEn: 'Platform', href: '#platform' },
  { labelKey: 'contact', labelEs: 'Contacto', labelEn: 'Contact', href: '#contact' },
];

const MODULES = [
  {
    id: 'sales',
    icon: ShoppingCart,
    nameEs: 'Ventas',
    nameEn: 'Sales',
    descEs: 'Gestión completa del ciclo de ventas — cotizaciones, facturas, devoluciones y comisiones.',
    descEn: 'Full sales cycle management — quotes, invoices, returns, and commissions.',
    accent: '#4A8EFF',
    featuresEs: ['Cotizaciones y facturas', 'Comisiones de ventas', 'Gestión de clientes', 'Seguimiento de pagos'],
    featuresEn: ['Quotes & invoices', 'Sales commissions', 'Client management', 'Payment tracking'],
  },
  {
    id: 'inventory',
    icon: Package,
    nameEs: 'Inventario',
    nameEn: 'Inventory',
    descEs: 'Control de stock multi-almacén con transferencias, puntos de reorden y categorías.',
    descEn: 'Multi-warehouse stock control with transfers, reorder points, and categories.',
    accent: '#34D399',
    featuresEs: ['Multi-almacén', 'Transferencias de stock', 'Alertas de reorden', 'Categorías de productos'],
    featuresEn: ['Multi-warehouse', 'Stock transfers', 'Reorder alerts', 'Product categories'],
  },
  {
    id: 'cash',
    icon: CreditCard,
    nameEs: 'Caja y Pagos',
    nameEn: 'Cash & Payments',
    descEs: 'Gestión de caja registradora y reconciliación de pagos multi-método.',
    descEn: 'Cash register management and multi-method payment reconciliation.',
    accent: '#D4785C',
    featuresEs: ['Cajas registradoras', 'Multi-moneda', 'Métodos de pago', 'Cierres diarios'],
    featuresEn: ['Cash registers', 'Multi-currency', 'Payment methods', 'Daily closures'],
  },
  {
    id: 'localization',
    icon: Globe,
    nameEs: 'Localización',
    nameEn: 'Localization',
    descEs: 'Adáptese a las regulaciones locales — requisitos fiscales, impuestos y controles de moneda.',
    descEn: 'Adapt to local regulations — fiscal requirements, taxes, and currency controls.',
    accent: '#A78BFA',
    featuresEs: ['Cumplimiento fiscal', 'Impuestos locales', 'Tasas de cambio', 'Documentos legales'],
    featuresEn: ['Fiscal compliance', 'Local tax rules', 'Currency rates', 'Legal documents'],
  },
];

const DOCUMENT_STATES = [
  { id: 'draft', labelEs: 'Borrador', labelEn: 'Draft', color: '#52525B' },
  { id: 'approved', labelEs: 'Aprobado', labelEn: 'Approved', color: '#4A8EFF' },
  { id: 'paid', labelEs: 'Pagado', labelEn: 'Paid', color: '#34D399' },
  { id: 'cancelled', labelEs: 'Cancelado', labelEn: 'Cancelled', color: '#EF4444' },
];

const DOC_STATE_DESCS_ES = [
  'El documento se está creando. Se permiten ediciones y nada es definitivo.',
  'El documento ha sido validado y aprobado. Está listo para ser procesado.',
  'El pago ha sido recibido y el documento está completamente liquidado.',
  'El documento ha sido cancelado. Todas las transacciones asociadas han sido revertidas.',
];

const DOC_STATE_DESCS_EN = [
  'The document is being created. Edits are allowed and nothing is final.',
  'The document has been validated and approved. It is ready for processing.',
  'Payment has been received and the document is fully settled.',
  'The document has been cancelled. All associated transactions are reversed.',
];

const KPI_DATA = {
  es: [
    { label: 'Ingresos Mensuales', value: '$48.250', change: '+12,3%', positive: true },
    { label: 'Órdenes Activas', value: '143', change: '+8,1%', positive: true },
    { label: 'Alertas de Stock', value: '7', change: '-3', positive: true },
    { label: 'Pagos Pendientes', value: '$12.400', change: '+5,2%', positive: false },
  ],
  en: [
    { label: 'Monthly Revenue', value: '$48,250', change: '+12.3%', positive: true },
    { label: 'Active Orders', value: '143', change: '+8.1%', positive: true },
    { label: 'Stock Alerts', value: '7', change: '-3', positive: true },
    { label: 'Pending Payments', value: '$12,400', change: '+5.2%', positive: false },
  ],
};

const TABLE_DATA = {
  es: [
    { client: 'Comercial CA', amount: '$4.200', status: 'Pagado', statusClass: 'paid', date: '2026-07-05' },
    { client: 'Distribuidora ABC', amount: '$2.850', status: 'Pendiente', statusClass: 'pending', date: '2026-07-04' },
    { client: 'Inversiones XYZ', amount: '$6.100', status: 'Aprobado', statusClass: 'approved', date: '2026-07-03' },
    { client: 'Grupo Nova', amount: '$1.950', status: 'Borrador', statusClass: 'draft', date: '2026-07-03' },
    { client: 'Servicios RL', amount: '$3.400', status: 'Pagado', statusClass: 'paid', date: '2026-07-02' },
  ],
  en: [
    { client: 'Comercial CA', amount: '$4,200', status: 'Paid', statusClass: 'paid', date: '2026-07-05' },
    { client: 'Distribuidora ABC', amount: '$2,850', status: 'Pending', statusClass: 'pending', date: '2026-07-04' },
    { client: 'Inversiones XYZ', amount: '$6,100', status: 'Approved', statusClass: 'approved', date: '2026-07-03' },
    { client: 'Grupo Nova', amount: '$1,950', status: 'Draft', statusClass: 'draft', date: '2026-07-03' },
    { client: 'Servicios RL', amount: '$3,400', status: 'Paid', statusClass: 'paid', date: '2026-07-02' },
  ],
};

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-[#34D399]/10 text-[#34D399]',
  pending: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  approved: 'bg-[#4A8EFF]/10 text-[#4A8EFF]',
  draft: 'bg-[#52525B]/10 text-[var(--lp-text-secondary)]',
};

function getLocale(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('lp-locale') || 'es' : 'es';
}

function useLocale() {
  const [locale, setLocaleState] = useState(getLocale);
  const toggle = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === 'es' ? 'en' : 'es';
      localStorage.setItem('lp-locale', next);
      return next;
    });
  }, []);
  const setLocale = useCallback((next: string) => {
    if (next !== 'es' && next !== 'en') return;
    localStorage.setItem('lp-locale', next);
    setLocaleState(next);
  }, []);
  return { locale, toggle, setLocale };
}

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function FadeIn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

const THEMES = [
  { id: 'premium-dark', labelEs: 'Oscuro', labelEn: 'Dark', icon: Moon },
  { id: 'obsidian-emerald', labelEs: 'Esmeralda', labelEn: 'Emerald', icon: Moon },
  { id: 'nordic-light', labelEs: 'Claro Nórdico', labelEn: 'Nordic Light', icon: Sun },
  { id: 'warm-light', labelEs: 'Claro Cálido', labelEn: 'Warm Light', icon: Sun },
];

function Navbar({ locale, onChangeLocale, theme, onChangeTheme }: { locale: string; onChangeLocale: (locale: string) => void; theme: string; onChangeTheme: (id: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLangOpen(false);
        setThemeOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[var(--lp-surface)]/80 backdrop-blur-lg border-b border-[var(--lp-border)] ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5">
          <Logo variant="isologo" className="h-8 w-auto" edgeColor="var(--lp-text)" />
          <Logo variant="logotipo" className="h-6 w-auto hidden sm:block" edgeColor="var(--lp-text)" />
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); handleNav(link.href); }}
              className="text-sm font-medium text-[var(--lp-text-secondary)] transition-colors hover:text-[var(--lp-text)]"
            >
              {locale === 'es' ? link.labelEs : link.labelEn}
            </a>
          ))}
          <div ref={themeRef} className="relative">
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              aria-expanded={themeOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--lp-border-hover)] px-3 py-1.5 text-xs font-medium text-[var(--lp-text-secondary)] transition-colors hover:border-[var(--lp-border-hover-alt)] hover:text-[var(--lp-text)]"
            >
              {theme.includes('light') ? <Sun size={14} /> : <Moon size={14} />}
              {THEMES.find((t) => t.id === theme) ? (locale === 'es' ? THEMES.find((t) => t.id === theme)!.labelEs : THEMES.find((t) => t.id === theme)!.labelEn) : theme}
              <ChevronDown size={12} className={`transition-transform ${themeOpen ? 'rotate-180' : ''}`} />
            </button>
            {themeOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] py-1 shadow-2xl">
                {THEMES.map((t) => {
                  const TIcon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { onChangeTheme(t.id); setThemeOpen(false); }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--lp-elevated)] ${
                        t.id === theme ? 'text-[#4A8EFF] font-medium' : 'text-[var(--lp-text-secondary)]'
                      }`}
                    >
                      <TIcon size={14} />
                      {locale === 'es' ? t.labelEs : t.labelEn}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              aria-expanded={langOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--lp-border-hover)] px-3 py-1.5 text-xs font-medium text-[var(--lp-text-secondary)] transition-colors hover:border-[var(--lp-border-hover-alt)] hover:text-[var(--lp-text)]"
            >
              <Languages size={14} />
              {currentLang.label}
              <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 overflow-hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] py-1 shadow-2xl">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { onChangeLocale(lang.code); setLangOpen(false); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--lp-elevated)] ${
                      lang.code === locale ? 'text-[#4A8EFF] font-medium' : 'text-[var(--lp-text-secondary)]'
                    }`}
                  >
                    <span>{lang.code === 'es' ? '🇪🇸' : '🇺🇸'}</span>
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <a
            href="#dashboard"
            onClick={(e) => { e.preventDefault(); document.querySelector('#dashboard')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="rounded-lg bg-[#4A8EFF] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#3B7EEF]"
          >
            {locale === 'es' ? 'Iniciar sesión' : 'Sign in'}
          </a>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              aria-expanded={langOpen}
              aria-haspopup="menu"
              aria-label={locale === 'es' ? 'Cambiar idioma' : 'Change language'}
              className="flex items-center gap-1 rounded-lg border border-[var(--lp-border-hover)] px-2.5 py-1.5 text-xs font-medium text-[var(--lp-text-secondary)]"
            >
              <Languages size={14} />
              {locale === 'es' ? 'ES' : 'EN'}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 overflow-hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] py-1 shadow-2xl">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { onChangeLocale(lang.code); setLangOpen(false); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--lp-elevated)] ${
                      lang.code === locale ? 'text-[#4A8EFF] font-medium' : 'text-[var(--lp-text-secondary)]'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            className="text-[var(--lp-text-secondary)] hover:text-[var(--lp-text)]"
            aria-label={mobileOpen ? (locale === 'es' ? 'Cerrar menú' : 'Close menu') : (locale === 'es' ? 'Abrir menú' : 'Open menu')}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="landing-mobile-menu" className="border-t border-[var(--lp-border)] bg-[var(--lp-bg)] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleNav(link.href); }}
                className="text-sm font-medium text-[var(--lp-text-secondary)] transition-colors hover:text-[var(--lp-text)]"
              >
                {locale === 'es' ? link.labelEs : link.labelEn}
              </a>
            ))}
            <a
              href="/login"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#4A8EFF] px-5 py-2 text-sm font-semibold text-white"
            >
              {locale === 'es' ? 'Iniciar sesión' : 'Sign in'}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero({ locale }: { locale: string }) {
  const isEs = locale === 'es';

  return (
    <section className="relative bg-[var(--lp-bg)] pt-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#4A8EFF]/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#34D399]/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxRjFGMjQiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMjAgMjBhMjAgMjAgMCAwIDEgMjAgMjBIMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center py-16 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-surface)] px-3 py-1 md:px-4 md:py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] animate-pulse md:h-2 md:w-2" />
              <span className="text-[10px] font-medium text-[var(--lp-text-secondary)] md:text-xs">
                {isEs ? 'Diseñado para ventas rápidas' : 'Designed for fast sales'}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold leading-[1.05] tracking-tight text-[var(--lp-text)] md:text-6xl lg:text-7xl sm:text-4xl">
              {isEs ? 'Una venta completa, sin fricción' : 'Complete a sale without friction'}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--lp-text-secondary)] md:mt-6 md:text-lg sm:text-base">
              {isEs
                ? 'Busque o escanee productos, cobre con el método adecuado y entregue la factura desde una sola caja.'
                : 'Search or scan products, accept the right payment method, and issue the invoice from one checkout.'}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:mt-10">
              <a
                href="/login"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#4A8EFF] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3B7EEF] hover:shadow-lg hover:shadow-[#4A8EFF]/20 md:px-7 md:py-3"
              >
                {isEs ? 'Ver la caja en acción' : 'See checkout in action'}
                <ArrowRight size={16} />
              </a>
              <a
                href="#modules"
                onClick={(e) => { e.preventDefault(); document.querySelector('#modules')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[var(--lp-border-hover)] px-6 py-2.5 text-sm font-semibold text-[var(--lp-text-secondary)] transition-all hover:border-[var(--lp-border-hover-alt)] hover:text-[var(--lp-text)] md:px-7 md:py-3"
              >
                {isEs ? 'Explorar módulos' : 'Explore modules'}
              </a>
            </div>
          </div>

          <div className="mt-16 w-full max-w-7xl grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 md:gap-4 sm:px-0">
            {MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className="group relative overflow-hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--lp-border-hover)] hover:shadow-lg md:p-5 sm:p-4"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"
                    style={{ background: `radial-gradient(ellipse at top right, ${mod.accent}, transparent 70%)` }}
                  />
                  <Icon size={18} className={`mb-2 ${i === 0 ? 'animate-float' : i === 1 ? 'animate-float-delayed' : i === 2 ? 'animate-float-slow' : 'animate-float'} md:mb-3 md:h-[22px] md:w-[22px]`} style={{ color: mod.accent }} />
                  <h3 className="text-xs font-semibold text-[var(--lp-text)] md:text-sm">{isEs ? mod.nameEs : mod.nameEn}</h3>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--lp-text-muted)] md:mt-1 md:text-xs sm:text-[11px]">{isEs ? mod.descEs : mod.descEn}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection({ locale }: { locale: string }) {
  const isEs = locale === 'es';
  const stats = [
    { value: 'POS', labelEs: 'Venta de mostrador', labelEn: 'Counter sales' },
    { value: 'SKU', labelEs: 'Escaneo e inventario', labelEn: 'Scanning & inventory' },
    { value: 'ERP', labelEs: 'Documentos conectados', labelEn: 'Connected documents' },
    { value: 'ES/EN', labelEs: 'Interfaz bilingüe', labelEn: 'Bilingual interface' },
  ];

  return (
    <section className="relative border-y border-[var(--lp-border)] bg-[var(--lp-bg-alt)] py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {stats.map((s, i) => (
            <div key={s.labelEs} className="text-center">
              <p className="text-2xl font-extrabold text-[var(--lp-text)] md:text-3xl" style={{ color: i === 0 ? '#4A8EFF' : i === 1 ? '#34D399' : i === 2 ? '#D4785C' : '#A78BFA' }}>
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--lp-text-muted)] md:text-sm">
                {isEs ? s.labelEs : s.labelEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModulesSection({ locale }: { locale: string }) {
  const isEs = locale === 'es';
  const { ref, visible } = useScrollReveal(0.05);

  return (
    <section id="modules" className="bg-[var(--lp-bg-alt)] py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className={`transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#4A8EFF]">
              {isEs ? 'Módulos' : 'Modules'}
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--lp-text)] md:mt-4 md:text-4xl sm:text-3xl">
              {isEs ? 'Conecte lo que necesita' : 'Plug in what you need'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-text-secondary)] md:mt-4 md:text-base">
              {isEs
                ? 'Cada módulo funciona de forma independiente. Actívelos a medida que su negocio crece — sin migraciones, sin tiempo de inactividad, sin complejidades innecesarias.'
                : 'Every module works independently. Activate them as your business grows — no migrations, no downtime, no unnecessary complexity.'}
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-6 sm:mt-16">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            const { ref: cardRef, visible: cardVisible } = useScrollReveal(0.05);
            const features = isEs ? mod.featuresEs : mod.featuresEn;
            return (
              <div
                key={mod.id}
                ref={cardRef}
                className={`group relative overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-5 transition-all duration-700 sm:p-8 ${
                  cardVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div
                  className="absolute top-0 right-0 h-24 w-24 rounded-bl-full opacity-0 transition-opacity duration-300 group-hover:opacity-[0.07] sm:h-32 sm:w-32"
                  style={{ background: mod.accent }}
                />
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
                    style={{ backgroundColor: `${mod.accent}15` }}
                  >
                    <Icon size={20} style={{ color: mod.accent }} className="sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[var(--lp-text)] sm:text-lg">{isEs ? mod.nameEs : mod.nameEn}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-text-secondary)] sm:mt-2">{isEs ? mod.descEs : mod.descEn}</p>
                    <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
                      {features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2 text-xs text-[var(--lp-text-muted)] sm:text-sm">
                          <Check size={12} className="shrink-0 sm:h-[14px] sm:w-[14px]" style={{ color: mod.accent }} />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  {
    id: 'free',
    nameEs: 'Gratuito',
    nameEn: 'Free',
    priceEs: 'Por confirmar',
    priceEn: 'To be confirmed',
    periodEs: '',
    periodEn: '',
    accent: '#A1A1AA',
    featuresEs: ['Hasta 5 usuarios', '1 almacén', 'Dashboard ejecutivo', 'Reportes básicos', 'Soporte por email'],
    featuresEn: ['Up to 5 users', '1 warehouse', 'Executive dashboard', 'Basic reports', 'Email support'],
    ctaEs: 'Comenzar gratis',
    ctaEn: 'Start free',
    highlighted: false,
  },
  {
    id: 'starter',
    nameEs: 'Starter',
    nameEn: 'Starter',
    priceEs: 'No publicado',
    priceEn: 'Not published',
    periodEs: '',
    periodEn: '',
    accent: '#4A8EFF',
    featuresEs: ['Usuarios ilimitados', '3 almacenes', 'Ventas + Compras', 'Inventario completo', 'Múltiples monedas', 'Soporte prioritario'],
    featuresEn: ['Unlimited users', '3 warehouses', 'Sales + Purchasing', 'Full inventory', 'Multi-currency', 'Priority support'],
    ctaEs: 'Notificarme',
    ctaEn: 'Notify me',
    highlighted: true,
  },
  {
    id: 'professional',
    nameEs: 'Profesional',
    nameEn: 'Professional',
    priceEs: 'Próximamente',
    priceEn: 'Coming soon',
    periodEs: '',
    periodEn: '',
    accent: '#D4785C',
    featuresEs: ['Todo lo de Starter', 'Almacenes ilimitados', 'Caja + Pagos', 'Localización fiscal', 'Comisiones', 'API pública', 'Canal de soporte prioritario'],
    featuresEn: ['Everything in Starter', 'Unlimited warehouses', 'Cash + Payments', 'Fiscal localization', 'Commissions', 'Public API', 'Priority support channel'],
    ctaEs: 'Notificarme',
    ctaEn: 'Notify me',
    highlighted: false,
  },
  {
    id: 'enterprise',
    nameEs: 'Enterprise',
    nameEn: 'Enterprise',
    priceEs: 'A medida',
    priceEn: 'Custom',
    periodEs: '',
    periodEn: '',
    accent: '#A78BFA',
    featuresEs: ['Todo lo de Profesional', 'Nómina + RRHH', 'Multi-tenant', 'SLA garantizado', 'On-premise disponible', 'Gerente de cuenta dedicado'],
    featuresEn: ['Everything in Professional', 'Payroll + HR', 'Multi-tenant', 'Guaranteed SLA', 'On-premise available', 'Dedicated account manager'],
    ctaEs: 'Contactar',
    ctaEn: 'Contact us',
    highlighted: false,
  },
];

function PlansSection({ locale }: { locale: string }) {
  const isEs = locale === 'es';

  return (
    <section id="plans" className="bg-[var(--lp-bg)] py-24 md:py-32">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#F59E0B]">
              {isEs ? 'Planes' : 'Plans'}
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--lp-text)] md:mt-4 md:text-4xl sm:text-3xl">
              {isEs ? 'El plan perfecto para cada negocio' : 'The right plan for every business'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-text-secondary)] md:mt-4 md:text-base">
              {isEs
                ? 'Consulte la disponibilidad y el alcance real de cada opción antes de contratar.'
                : 'Check the availability and actual scope of each option before purchasing.'}
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:mt-16 sm:gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${
                  plan.highlighted
                    ? 'border-[#4A8EFF] bg-[var(--lp-surface)] animate-pulse-glow'
                    : 'border-[var(--lp-border)] bg-[var(--lp-surface)] hover:border-[var(--lp-border-hover)]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#4A8EFF] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white sm:px-4">
                    {isEs ? 'Recomendado' : 'Recommended'}
                  </div>
                )}
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--lp-text)]" style={{ color: plan.accent }}>{isEs ? plan.nameEs : plan.nameEn}</h3>
                </div>
                <div className="mb-4">
                  <span className="text-xl font-extrabold text-[var(--lp-text)] sm:text-2xl">{isEs ? plan.priceEs : plan.priceEn}</span>
                  {plan.periodEs && (
                    <span className="ml-1 text-xs text-[var(--lp-text-muted)]">/{isEs ? plan.periodEs : plan.periodEn}</span>
                  )}
                </div>
                <ul className="mb-6 flex-1 space-y-2">
                  {(isEs ? plan.featuresEs : plan.featuresEn).map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-[var(--lp-text-secondary)] sm:text-sm">
                      <Check size={13} className="mt-0.5 shrink-0 text-[#34D399]" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`inline-flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-[#4A8EFF] text-white hover:bg-[#3B7EEF]'
                      : 'border border-[var(--lp-border-hover)] text-[var(--lp-text-secondary)] hover:border-[var(--lp-border-hover-alt)] hover:text-[var(--lp-text)]'
                  }`}
                >
                  {isEs ? plan.ctaEs : plan.ctaEn}
                </a>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function DocumentStateSection({ locale }: { locale: string }) {
  const isEs = locale === 'es';
  const [activeState, setActiveState] = useState(0);
  const descriptions = isEs ? DOC_STATE_DESCS_ES : DOC_STATE_DESCS_EN;

  return (
    <section id="workflow" className="bg-[var(--lp-bg)] py-24 md:py-32">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#34D399]">
              {isEs ? 'Flujo de trabajo' : 'Workflow'}
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--lp-text)] md:mt-4 md:text-4xl sm:text-3xl">
              {isEs ? 'Máquina de estados' : 'Document state machine'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-text-secondary)] md:mt-4 md:text-base">
              {isEs
                ? 'Cada documento fluye a través de una máquina de estados clara y configurable. Sepa exactamente dónde está cada transacción de un vistazo.'
                : 'Every document flows through a clear, configurable state machine. Know exactly where each transaction stands at a glance.'}
            </p>
          </div>

          <div className="mt-12 md:mt-16">
            <div className="flex items-center justify-center gap-0 overflow-x-auto px-2 pb-2">
              {DOCUMENT_STATES.map((state, i) => (
                <div key={state.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => setActiveState(i)}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 md:h-16 md:w-16 md:text-sm sm:h-12 sm:w-12 ${
                      activeState === i
                        ? 'scale-110 border-current shadow-lg'
                        : 'border-[var(--lp-border-hover)] text-[var(--lp-text-muted-alt)] hover:border-[var(--lp-border-hover-alt)]'
                    }`}
                    style={{
                      borderColor: activeState === i ? state.color : undefined,
                      color: activeState === i ? state.color : undefined,
                      boxShadow: activeState === i ? `0 0 20px ${state.color}30` : undefined,
                    }}
                  >
                    {i + 1}
                  </button>
                  {i < DOCUMENT_STATES.length - 1 && (
                    <div
                      className={`h-0.5 w-6 transition-all duration-500 sm:w-12 md:w-24 ${
                        i < activeState ? 'bg-[#34D399]' : 'bg-[#27272A]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 mx-auto max-w-md rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-6 text-center md:mt-10 md:p-8">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold md:mb-4 md:h-14 md:w-14 md:text-2xl sm:h-[52px] sm:w-[52px]"
                style={{
                  backgroundColor: `${DOCUMENT_STATES[activeState].color}15`,
                  color: DOCUMENT_STATES[activeState].color,
                }}
              >
                {activeState + 1}
              </div>
              <h3 className="text-lg font-bold text-[var(--lp-text)] sm:text-xl">
                {isEs ? DOCUMENT_STATES[activeState].labelEs : DOCUMENT_STATES[activeState].labelEn}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--lp-text-secondary)] sm:mt-3">{descriptions[activeState]}</p>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function DashboardPreviewSection({ locale }: { locale: string }) {
  const isEs = locale === 'es';
  const kpis = KPI_DATA[locale as keyof typeof KPI_DATA] || KPI_DATA.es;
  const rows = TABLE_DATA[locale as keyof typeof TABLE_DATA] || TABLE_DATA.es;

  return (
    <section id="dashboard" className="bg-[var(--lp-bg-alt)] py-24 md:py-32">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#A78BFA]">
              {isEs ? 'Panel de control' : 'Dashboard'}
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--lp-text)] md:mt-4 md:text-4xl sm:text-3xl">
              {isEs ? 'Vista ilustrativa del panel' : 'Illustrative dashboard preview'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-text-secondary)] md:mt-4 md:text-base">
              {isEs
                ? 'Ejemplo visual con datos ficticios. Los valores mostrados no representan resultados reales.'
                : 'Visual example with fictional data. The displayed values do not represent real results.'}
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4 md:mt-12">
            {kpis.map((kpi, i) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-4 transition-all duration-300 hover:border-[var(--lp-border-hover)] hover:-translate-y-0.5 md:p-5"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--lp-text-muted)] md:text-xs">{kpi.label}</p>
                <p className="mt-1.5 text-xl font-bold text-[var(--lp-text)] md:mt-2 md:text-2xl">{kpi.value}</p>
                <span
                  className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
                    kpi.positive ? 'text-[#34D399]' : 'text-[#EF4444]'
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--lp-border)]">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--lp-text-muted)]">
                      {isEs ? 'Cliente' : 'Client'}
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--lp-text-muted)]">
                      {isEs ? 'Monto' : 'Amount'}
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--lp-text-muted)]">
                      {isEs ? 'Estado' : 'Status'}
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--lp-text-muted)]">
                      {isEs ? 'Fecha' : 'Date'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.client} className="border-b border-[var(--lp-border)]/50 last:border-0 hover:bg-[var(--lp-elevated)]">
                      <td className="px-5 py-3 font-medium text-[var(--lp-text)]">{row.client}</td>
                      <td className="px-5 py-3 text-[var(--lp-text-secondary)]">{row.amount}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.statusClass] || ''}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[var(--lp-text-muted)]">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function PlatformSection({ locale }: { locale: string }) {
  const isEs = locale === 'es';

  const items = [
    {
      icon: Layers,
      titleEs: 'Arquitectura modular',
      titleEn: 'Modular architecture',
      descEs: 'Cada módulo es un plugin independiente. Active solo lo que necesita — sin suites monolíticas.',
      descEn: 'Each module is an independent plugin. Enable only what you need — no bloated all-in-one suites.',
      accent: '#4A8EFF',
    },
    {
      icon: Database,
      titleEs: 'Multi-tenencia nativa',
      titleEn: 'Multi-tenant by design',
      descEs: 'Construido sobre PostgreSQL 16 con aislamiento de tenants. Sus datos están seguros y separados.',
      descEn: 'Built on PostgreSQL 16 with tenant isolation. Your data stays secure and separate.',
      accent: '#34D399',
    },
    {
      icon: Zap,
      titleEs: 'Rendimiento optimizado',
      titleEn: 'Performance optimized',
      descEs: 'React 19 + Vite 6 ofrecen carga de páginas en fracciones de segundo. TanStack Query mantiene los datos frescos sin parpadeos.',
      descEn: 'React 19 + Vite 6 delivers sub-second page loads. TanStack Query keeps data fresh without flicker.',
      accent: '#D4785C',
    },
    {
      icon: Shield,
      titleEs: 'Seguridad empresarial',
      titleEn: 'Enterprise-grade security',
      descEs: 'Autenticación JWT, control de acceso basado en roles y registro de auditoría listos para usar.',
      descEn: 'JWT authentication, role-based access control, and audit logging out of the box.',
      accent: '#A78BFA',
    },
  ];

  return (
    <section id="platform" className="bg-[var(--lp-bg)] py-24 md:py-32">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D4785C]">
              {isEs ? 'Plataforma' : 'Platform'}
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--lp-text)] md:mt-4 md:text-4xl sm:text-3xl">
              {isEs ? 'Construido para rendir' : 'Built for performance'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-text-secondary)] md:mt-4 md:text-base">
              {isEs ? 'Stack moderno, arquitectura limpia y obsesión por el detalle.' : 'Modern stack, clean architecture, and obsessive attention to detail.'}
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:gap-5 md:mt-16">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.titleEs}
                  className="group rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-5 transition-all duration-300 hover:border-[var(--lp-border-hover)] hover:-translate-y-0.5 md:p-6"
                >
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 md:mb-4 md:h-10 md:w-10"
                    style={{ backgroundColor: `${item.accent}15` }}
                  >
                    <Icon size={18} className="md:h-5 md:w-5" style={{ color: item.accent }} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--lp-text)] sm:text-base">{isEs ? item.titleEs : item.titleEn}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-text-secondary)] sm:mt-2">{isEs ? item.descEs : item.descEn}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-6 md:p-12 sm:p-8 md:mt-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <Server size={22} className="text-[#4A8EFF] md:h-6 md:w-6" />
              <h3 className="text-lg font-bold text-[var(--lp-text)] sm:text-xl">
                {isEs ? 'Stack tecnológico' : 'Technology stack'}
              </h3>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2 md:mt-6">
              {['NestJS 11', 'React 19', 'TypeScript 5', 'PostgreSQL 16', 'Prisma ORM', 'Redis', 'Tailwind CSS 4', 'Docker'].map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg border border-[var(--lp-border)] bg-[var(--lp-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--lp-text-secondary)] transition-all hover:border-[var(--lp-border-hover)] md:px-3 md:py-1.5"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function ContactSection({ locale }: { locale: string }) {
  const isEs = locale === 'es';
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
        setForm({ name: '', email: '', company: '', message: '' });
        setTimeout(() => setSent(false), 4000);
      } else {
        setError(isEs ? 'No se pudo enviar el mensaje. Intente nuevamente.' : 'The message could not be sent. Please try again.');
      }
    } catch {
      setError(isEs ? 'No se pudo conectar con el servidor. Revise su conexión e intente nuevamente.' : 'Could not connect to the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }, [form, isEs]);

  return (
    <section id="contact" className="bg-[var(--lp-bg-alt)] py-24 md:py-32">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#4A8EFF]">
              {isEs ? 'Contacto' : 'Contact'}
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--lp-text)] md:mt-4 md:text-4xl sm:text-3xl">
              {isEs ? '¿Listo para empezar?' : 'Ready to get started?'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--lp-text-secondary)] md:mt-4 md:text-base">
              {isEs
                ? 'Cuéntenos sobre su negocio y le ayudaremos a configurar los módulos adecuados.'
                : 'Tell us about your business and we will help you configure the right modules.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-lg space-y-4 md:mt-12 md:space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 md:gap-5">
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-medium text-[var(--lp-text-secondary)] md:mb-1.5">
                  {isEs ? 'Nombre' : 'Name'}
                </label>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--lp-border-hover)] bg-[var(--lp-surface)] px-3.5 py-2.5 text-sm text-[var(--lp-text)] placeholder-[var(--lp-text-muted-alt)] outline-none transition-colors focus-visible:border-[var(--lp-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--lp-border-focus)]/30 md:px-4"
                  placeholder={isEs ? 'Su nombre' : 'Your name'}
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-[var(--lp-text-secondary)] md:mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-[var(--lp-border-hover)] bg-[var(--lp-surface)] px-3.5 py-2.5 text-sm text-[var(--lp-text)] placeholder-[var(--lp-text-muted-alt)] outline-none transition-colors focus-visible:border-[var(--lp-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--lp-border-focus)]/30 md:px-4"
                  placeholder={isEs ? 'usted@empresa.com' : 'you@company.com'}
                />
              </div>
            </div>
            <div>
              <label htmlFor="company" className="mb-1 block text-xs font-medium text-[var(--lp-text-secondary)] md:mb-1.5">
                {isEs ? 'Empresa' : 'Company'}
              </label>
              <input
                id="company"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full rounded-lg border border-[var(--lp-border-hover)] bg-[var(--lp-surface)] px-3.5 py-2.5 text-sm text-[var(--lp-text)] placeholder-[var(--lp-text-muted-alt)] outline-none transition-colors focus-visible:border-[var(--lp-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--lp-border-focus)]/30 md:px-4"
                placeholder={isEs ? 'Su empresa' : 'Your company'}
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-1 block text-xs font-medium text-[var(--lp-text-secondary)] md:mb-1.5">
                {isEs ? 'Mensaje' : 'Message'}
              </label>
              <textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-none rounded-lg border border-[var(--lp-border-hover)] bg-[var(--lp-surface)] px-3.5 py-2.5 text-sm text-[var(--lp-text)] placeholder-[var(--lp-text-muted-alt)] outline-none transition-colors focus-visible:border-[var(--lp-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--lp-border-focus)]/30 md:px-4"
                placeholder={isEs ? 'Cuéntenos sobre sus necesidades...' : 'Tell us about your needs...'}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4A8EFF] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3B7EEF] hover:shadow-lg hover:shadow-[#4A8EFF]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:px-7 md:py-3"
            >
              {submitting ? (
                isEs ? 'Enviando…' : 'Sending…'
              ) : sent ? (
                isEs ? '¡Enviado! Nos pondremos en contacto.' : 'Sent! We will be in touch.'
              ) : (
                <>
                  {isEs ? 'Enviar mensaje' : 'Send message'}
                  <Send size={16} />
                </>
              )}
            </button>
            {(sent || error) && (
              <p
                role={error ? 'alert' : 'status'}
                aria-live="polite"
                className={`text-center text-sm ${error ? 'text-[#EF4444]' : 'text-[#34D399]'}`}
              >
                {error || (isEs ? 'Mensaje enviado correctamente.' : 'Message sent successfully.')}
              </p>
            )}
          </form>
        </div>
      </FadeIn>
    </section>
  );
}

function Footer({ locale }: { locale: string }) {
  const isEs = locale === 'es';

  return (
    <footer className="border-t border-[var(--lp-border)] bg-[var(--lp-bg)] py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row md:gap-6">
          <div className="flex items-center gap-2.5">
            <Logo variant="isologo" className="h-6 w-auto sm:h-7" edgeColor="var(--lp-text)" />
            <span className="text-sm font-bold text-[var(--lp-text)]">Atrio ERP</span>
          </div>
          <p className="text-[11px] text-[var(--lp-text-muted-alt)] sm:text-xs">
            &copy; {new Date().getFullYear()} Odalx. {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}
          </p>
          <nav aria-label={isEs ? 'Enlaces legales' : 'Legal links'} className="flex gap-4 text-xs text-[var(--lp-text-secondary)]">
            <a href="/privacy" className="hover:text-[var(--lp-text)]">{isEs ? 'Privacidad' : 'Privacy'}</a>
            <a href="/terms" className="hover:text-[var(--lp-text)]">{isEs ? 'Términos' : 'Terms'}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

const LP_THEMES: Record<string, Record<string, string>> = {
  'premium-dark': {
    '--lp-bg': '#09090B',
    '--lp-bg-alt': '#0B0B0E',
    '--lp-surface': '#111113',
    '--lp-elevated': '#18181B',
    '--lp-border': '#1E1E24',
    '--lp-border-hover': '#27272A',
    '--lp-border-hover-alt': '#3B3B45',
    '--lp-text': '#F4F4F5',
    '--lp-text-secondary': '#A1A1AA',
    '--lp-text-muted': '#63636E',
    '--lp-text-muted-alt': '#52525B',
  },
  'obsidian-emerald': {
    '--lp-bg': '#060814',
    '--lp-bg-alt': '#080B18',
    '--lp-surface': '#0F172A',
    '--lp-elevated': '#1A2332',
    '--lp-border': '#134E4A',
    '--lp-border-hover': '#16635B',
    '--lp-border-hover-alt': '#1A7568',
    '--lp-text': '#E0F2FE',
    '--lp-text-secondary': '#94A3B8',
    '--lp-text-muted': '#475569',
    '--lp-text-muted-alt': '#334155',
  },
  'nordic-light': {
    '--lp-bg': '#f5f5f4',
    '--lp-bg-alt': '#efefee',
    '--lp-surface': '#ffffff',
    '--lp-elevated': '#e6e8e7',
    '--lp-border': '#d9ddde',
    '--lp-border-hover': '#c9cdce',
    '--lp-border-hover-alt': '#bcc1c2',
    '--lp-text': '#2c3942',
    '--lp-text-secondary': '#445e6f',
    '--lp-text-muted': '#607887',
    '--lp-text-muted-alt': '#526c7a',
  },
  'warm-light': {
    '--lp-bg': '#faf8f5',
    '--lp-bg-alt': '#f2efe9',
    '--lp-surface': '#ffffff',
    '--lp-elevated': '#f0ede8',
    '--lp-border': '#e0dbd4',
    '--lp-border-hover': '#d5cfc6',
    '--lp-border-hover-alt': '#cbc1b5',
    '--lp-text': '#2a373d',
    '--lp-text-secondary': '#445e6f',
    '--lp-text-muted': '#607887',
    '--lp-text-muted-alt': '#526c7a',
  },
};

function getTheme(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('lp-theme') || 'premium-dark' : 'premium-dark';
}

function applyTheme(id: string) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem('lp-theme', id);
}

export function LandingPage() {
  const { locale, setLocale } = useLocale();
  const [theme, setThemeState] = useState(getTheme);
  const colors = LP_THEMES[theme] || LP_THEMES['premium-dark'];

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleChangeTheme = useCallback((id: string) => {
    setThemeState(id);
  }, []);

  return (
    <div
      className="fixed inset-0 font-sans antialiased overflow-y-auto scroll-smooth"
      style={colors as React.CSSProperties}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(74,142,255,0.15); }
          50% { box-shadow: 0 0 35px rgba(74,142,255,0.3); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out 0.5s infinite; }
        .animate-float-slow { animation: float 4s ease-in-out 0.2s infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.6s ease-out forwards; }
        .animate-fade-up-delayed { animation: fade-up 0.6s ease-out 0.15s forwards; opacity: 0; }
        .animate-fade-up-more { animation: fade-up 0.6s ease-out 0.3s forwards; opacity: 0; }
        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-float-delayed, .animate-float-slow,
          .animate-pulse-glow { animation: none; }
          .transition-all, .transition-colors, .transition-transform { transition-duration: 0.01ms !important; }
        }
      `}</style>
      <a
        href="#landing-main"
        className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-[var(--lp-text)] px-4 py-2 text-sm font-semibold text-[var(--lp-bg)] focus:not-sr-only"
      >
        {locale === 'es' ? 'Saltar al contenido' : 'Skip to content'}
      </a>
      <Navbar locale={locale} onChangeLocale={setLocale} theme={theme} onChangeTheme={handleChangeTheme} />
      <main id="landing-main">
        <Hero locale={locale} />
        <StatsSection locale={locale} />
        <ModulesSection locale={locale} />
        <PlansSection locale={locale} />
        <DocumentStateSection locale={locale} />
        <DashboardPreviewSection locale={locale} />
        <PlatformSection locale={locale} />
        <ContactSection locale={locale} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}

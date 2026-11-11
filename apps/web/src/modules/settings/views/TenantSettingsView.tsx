import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useTenantStore } from '@/core/tenant/store';
import { useTenant, useUpdateTenant, useTenantModules, useUpdateTenantModules } from '../hooks/useTenant';
import { useThemeStore, themeOptions } from '@/core/store/theme-store';
import {
  Settings,
  Building2,
  Blocks,
  SlidersHorizontal,
  Package,
  ShoppingCart,
  Receipt,
  DollarSign,
  Bell,
  Palette,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';

interface ExchangeRateProviderConfig {
  id: string;
  name: string;
  urlTemplate: string;
  ratePath: string;
  datePath: string;
  apiKeyHeader: string;
  apiKey: string;
  enabled: boolean;
}

const MODULES = [
  { id: 'reports', label: 'settings.modules.reports' },
  { id: 'sales', label: 'settings.modules.sales' },
  { id: 'inventory', label: 'settings.modules.inventory' },
  { id: 'purchasing', label: 'settings.modules.purchasing' },
  { id: 'cash', label: 'settings.modules.cash' },
  { id: 'localization', label: 'settings.modules.localization' },
  { id: 'clients', label: 'settings.modules.clients' },
  { id: 'vendors', label: 'settings.modules.vendors' },
  { id: 'hr', label: 'settings.modules.hr' },
];

interface SidebarTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number }>;
}

interface SidebarGroup {
  label: string;
  tabs: SidebarTab[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: 'settings.groups.general',
    tabs: [
      { id: 'company', label: 'settings.tabs.company', icon: Building2 },
      { id: 'general', label: 'settings.tabs.general', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'settings.groups.modules',
    tabs: [
      { id: 'modules', label: 'settings.tabs.modules', icon: Blocks },
    ],
  },
  {
    label: 'settings.groups.sales',
    tabs: [
      { id: 'sales', label: 'settings.tabs.sales', icon: ShoppingCart },
      { id: 'fiscal', label: 'settings.tabs.fiscal', icon: Receipt },
    ],
  },
  {
    label: 'settings.groups.inventory',
    tabs: [
      { id: 'inventory', label: 'settings.tabs.inventory', icon: Package },
    ],
  },
  {
    label: 'settings.groups.financial',
    tabs: [
      { id: 'financial', label: 'settings.tabs.financial', icon: DollarSign },
    ],
  },
  {
    label: 'settings.groups.theme',
    tabs: [
      { id: 'theme', label: 'settings.tabs.theme', icon: Palette },
    ],
  },
  {
    label: 'settings.groups.system',
    tabs: [
      { id: 'system', label: 'settings.tabs.system', icon: Settings },
    ],
  },
];

const ALL_SECTIONS = SIDEBAR_GROUPS.flatMap((g) => g.tabs);

function useScrollSpy(sectionIds: string[], offset = 120): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: `-${offset}px 0px -40% 0px`, threshold: 0 },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds, offset]);

  return active;
}

function getExistingSettings(tenant: unknown): Record<string, any> {
  return ((tenant as any)?.settings as Record<string, any>) || {};
}

function SettingsCard({ title, subtitle, children, onSave, isPending, isSuccess }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSave: () => void;
  isPending: boolean;
  isSuccess: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="p-6">
        <h2 className="mb-1 text-base font-bold text-text-primary">{title}</h2>
        <p className="mb-6 text-sm text-text-muted">{subtitle}</p>
        {children}
        <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
          <button
            onClick={onSave}
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {isPending ? t('common.loading') : t('common.save')}
          </button>
          {isSuccess && <span className="text-xs text-success">{t('settings.saved')}</span>}
        </div>
      </div>
    </div>
  );
}

function SelectField({ id, label, value, onChange, options }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-secondary" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function InputField({ id, label, type = 'text', value, onChange, min, max, placeholder }: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-secondary" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function CheckboxField({ id, label, checked, onChange }: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-canvas p-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-accent"
      />
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}

function SidebarNav({
  groups,
  activeSection,
  onNavigate,
}: {
  groups: SidebarGroup[];
  activeSection: string | null;
  onNavigate: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <nav className="sticky top-0 flex w-[240px] shrink-0 flex-col self-start overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-accent-alpha to-transparent px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
            <Settings size={18} />
          </div>
          <span className="text-sm font-bold text-text-primary">{t('settings.title')}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">
              {t(group.label)}
            </p>
            {group.tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent-alpha text-accent shadow-sm'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded ${isActive ? 'text-accent' : 'text-text-muted'}`}>
                    <Icon size={18} />
                  </div>
                  {t(tab.label)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}

export function TenantSettingsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tenantId = useTenantStore((s) => s.activeTenantId);
  const { data: tenant, isLoading } = useTenant(tenantId);
  const updateTenant = useUpdateTenant(tenantId);
  const { data: modulesData } = useTenantModules(tenantId);
  const updateModules = useUpdateTenantModules(tenantId);

  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('');
  const [timezone, setTimezone] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const [language, setLanguage] = useState('');
  const [stockThreshold, setStockThreshold] = useState('');
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [stockAlertEmail, setStockAlertEmail] = useState(false);
  const [stockAlertRecipients, setStockAlertRecipients] = useState('');

  const [defaultCostMethod, setDefaultCostMethod] = useState('');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);

  const [defaultDocType, setDefaultDocType] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [enableCommissions, setEnableCommissions] = useState(false);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('');
  const [autoInvoiceNumbering, setAutoInvoiceNumbering] = useState(true);

  const [defaultVatRate, setDefaultVatRate] = useState('');
  const [autoWithholding, setAutoWithholding] = useState(false);
  const [defaultContributorType, setDefaultContributorType] = useState('');

  const [foreignCurrency, setForeignCurrency] = useState('');
  const [multicurrency, setMulticurrency] = useState(false);
  const [exchangeRateSource, setExchangeRateSource] = useState('');
  const [exchangeRateProviders, setExchangeRateProviders] = useState('automatic');
  const [customRateProviders, setCustomRateProviders] = useState<ExchangeRateProviderConfig[]>([]);

  const [sessionTimeout, setSessionTimeout] = useState('');
  const [enableAudit, setEnableAudit] = useState(true);

  const { primaryDark, primaryLight, setPrimaryDark, setPrimaryLight } = useThemeStore();

  const initRef = useRef(false);
  const genInitRef = useRef(false);
  const invInitRef = useRef(false);
  const salesInitRef = useRef(false);
  const fiscalInitRef = useRef(false);
  const financialInitRef = useRef(false);
  const systemInitRef = useRef(false);

  const sectionIds = useMemo(() => ALL_SECTIONS.map((s) => s.id), []);
  const activeSection = useScrollSpy(sectionIds);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!tenantId) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        {t('common.noTenantSelected')}
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-text-secondary">{t('common.loading')}</div>;
  }

  if (!tenant) {
    return <div className="flex h-full items-center justify-center text-text-secondary">{t('common.error')}</div>;
  }

  if (!initRef.current) {
    initRef.current = true;
    setLegalName(tenant.legalName);
    setTaxId(tenant.taxId);
    setBaseCurrency(tenant.baseCurrency);
    setTimezone(tenant.timezone);
  }

  if (!selectedModules.length && modulesData) {
    setSelectedModules(modulesData.enabledModules);
  }

  const s = getExistingSettings(tenant);

  if (!genInitRef.current && tenant.settings) {
    genInitRef.current = true;
    setLanguage(s.language || 'es');
    setStockThreshold(String(s.stockThreshold ?? 10));
    setLowStockAlerts(s.lowStockAlerts !== false);
    setStockAlertEmail(s.stockAlertEmail === true);
    setStockAlertRecipients(s.stockAlertRecipients || '');
  }

  if (!invInitRef.current && tenant.settings) {
    invInitRef.current = true;
    setDefaultCostMethod(s.defaultCostMethod || 'weighted_average');
    setAllowNegativeStock(s.allowNegativeStock === true);
  }

  if (!salesInitRef.current && tenant.settings) {
    salesInitRef.current = true;
    setDefaultDocType(s.defaultDocType || 'sales_invoice');
    setReceiptFooter(s.receiptFooter || '');
    setEnableCommissions(s.enableCommissions === true);
    setDefaultPaymentTerms(s.defaultPaymentTerms || 'cash');
    setAutoInvoiceNumbering(s.autoInvoiceNumbering !== false);
  }

  if (!fiscalInitRef.current && tenant.settings) {
    fiscalInitRef.current = true;
    setDefaultVatRate(String(s.defaultVatRate ?? 16));
    setAutoWithholding(s.autoWithholding === true);
    setDefaultContributorType(s.defaultContributorType || 'ordinary');
  }

  if (!financialInitRef.current && tenant.settings) {
    financialInitRef.current = true;
    setForeignCurrency(s.foreignCurrency || 'USD');
    setMulticurrency(s.multicurrency === true);
    setExchangeRateSource(s.exchangeRateSource || 'bcv');
    setExchangeRateProviders(s.exchangeRateProviders || 'automatic');
    const providerConfig = s.exchangeRateProviderConfig?.providers;
    setCustomRateProviders(Array.isArray(providerConfig)
      ? providerConfig.map((provider: any) => ({
          id: String(provider.id || ''),
          name: String(provider.name || ''),
          urlTemplate: String(provider.urlTemplate || ''),
          ratePath: String(provider.ratePath || ''),
          datePath: String(provider.datePath || ''),
          apiKeyHeader: String(provider.apiKeyHeader || ''),
          apiKey: String(provider.apiKey || ''),
          enabled: provider.enabled !== false,
        }))
      : []);
  }

  if (!systemInitRef.current && tenant.settings) {
    systemInitRef.current = true;
    setSessionTimeout(String(s.sessionTimeout ?? 60));
    setEnableAudit(s.enableAudit !== false);
  }

  const handleCompanySave = () => {
    updateTenant.mutate({ legalName, taxId, baseCurrency, timezone });
  };

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleModulesSave = () => {
    updateModules.mutate(selectedModules);
  };

  const handleGeneralSave = () => {
    updateTenant.mutate({
      settings: {
        ...getExistingSettings(tenant),
        language,
        stockThreshold: Number(stockThreshold),
        lowStockAlerts,
        stockAlertEmail,
        stockAlertRecipients,
      },
    });
  };

  const handleInventorySave = () => {
    updateTenant.mutate({
      settings: {
        ...getExistingSettings(tenant),
        defaultCostMethod,
        allowNegativeStock,
      },
    });
  };

  const handleSalesSave = () => {
    updateTenant.mutate({
      settings: {
        ...getExistingSettings(tenant),
        defaultDocType,
        receiptFooter,
        enableCommissions,
        defaultPaymentTerms,
        autoInvoiceNumbering,
      },
    });
  };

  const handleFiscalSave = () => {
    updateTenant.mutate({
      settings: {
        ...getExistingSettings(tenant),
        defaultVatRate: Number(defaultVatRate),
        autoWithholding,
        defaultContributorType,
      },
    });
  };

  const handleFinancialSave = () => {
    updateTenant.mutate({
      settings: {
        ...getExistingSettings(tenant),
        foreignCurrency,
        multicurrency,
        exchangeRateSource,
        exchangeRateProviders,
        exchangeRateProviderConfig: { providers: customRateProviders },
      },
    });
  };

  const handleSystemSave = () => {
    updateTenant.mutate({
      settings: {
        ...getExistingSettings(tenant),
        sessionTimeout: Number(sessionTimeout),
        enableAudit,
      },
    });
  };

  return (
    <div ref={scrollContainerRef} className="mx-auto flex h-full w-full gap-8 overflow-y-auto p-6">
      <SidebarNav groups={SIDEBAR_GROUPS} activeSection={activeSection} onNavigate={handleNavigate} />

      <div className="flex min-h-0 flex-1 flex-col gap-6 pb-24">
        <section id="company">
          <SettingsCard
            title={t('settings.company.title')}
            subtitle={t('settings.company.subtitle')}
            onSave={handleCompanySave}
            isPending={updateTenant.isPending}
            isSuccess={updateTenant.isSuccess}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <InputField id="legalName" label={t('settings.company.legalName')} value={legalName} onChange={setLegalName} />
              <InputField id="taxId" label={t('settings.company.taxId')} value={taxId} onChange={setTaxId} />
              <SelectField
                id="currency"
                label={t('settings.company.baseCurrency')}
                value={baseCurrency}
                onChange={setBaseCurrency}
                options={[
                  { value: 'VED', label: 'VED — Bolívar Digital' },
                  { value: 'USD', label: 'USD — Dólar' },
                  { value: 'EUR', label: 'EUR — Euro' },
                  { value: 'COP', label: 'COP — Peso Colombiano' },
                ]}
              />
              <SelectField
                id="timezone"
                label={t('settings.company.timezone')}
                value={timezone}
                onChange={setTimezone}
                options={[
                  { value: 'America/Caracas', label: 'America/Caracas (UTC−4)' },
                  { value: 'America/Bogota', label: 'America/Bogota (UTC−5)' },
                  { value: 'America/New_York', label: 'America/New_York (UTC−5/−4)' },
                  { value: 'UTC', label: 'UTC' },
                ]}
              />
            </div>
          </SettingsCard>
        </section>

        <section id="general">
          <SettingsCard
            title={t('settings.general.title')}
            subtitle={t('settings.general.subtitle')}
            onSave={handleGeneralSave}
            isPending={updateTenant.isPending}
            isSuccess={updateTenant.isSuccess}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <SelectField
                  id="language"
                  label={t('settings.general.language')}
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { value: 'es', label: 'Español' },
                    { value: 'en', label: 'English' },
                  ]}
                />
                <InputField
                  id="stockThreshold"
                  label={t('settings.general.stockThreshold')}
                  type="number"
                  min={0}
                  value={stockThreshold}
                  onChange={setStockThreshold}
                />
              </div>
              <CheckboxField id="lowStockAlerts" label={t('settings.general.lowStockAlerts')} checked={lowStockAlerts} onChange={setLowStockAlerts} />
            </div>
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="mb-1 text-sm font-bold text-text-primary">
                <Bell size={16} className="mr-1.5 inline-block text-accent" />
                {t('settings.notifications.title')}
              </h3>
              <p className="mb-4 text-sm text-text-muted">{t('settings.notifications.subtitle')}</p>
              <div className="space-y-4">
                <CheckboxField id="stockAlertEmail" label={t('settings.notifications.stockAlertEmail')} checked={stockAlertEmail} onChange={setStockAlertEmail} />
                {stockAlertEmail && (
                  <InputField
                    id="stockAlertRecipients"
                    label={t('settings.notifications.stockAlertRecipients')}
                    placeholder="correo@ejemplo.com, otro@ejemplo.com"
                    value={stockAlertRecipients}
                    onChange={setStockAlertRecipients}
                  />
                )}
              </div>
            </div>
          </SettingsCard>
        </section>

        <section id="modules">
          <div className="rounded-lg border border-border bg-surface shadow-sm">
            <div className="p-6">
              <h2 className="mb-1 text-base font-bold text-text-primary">{t('settings.modules.title')}</h2>
              <p className="mb-6 text-sm text-text-muted">{t('settings.modules.subtitle')}</p>
              <div className="grid grid-cols-2 gap-3">
                {MODULES.map((mod) => {
                  const enabled = selectedModules.includes(mod.id);
                  return (
                    <label
                      key={mod.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        enabled
                          ? 'border-accent/30 bg-accent-alpha'
                          : 'border-border bg-canvas hover:border-text-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleModule(mod.id)}
                        className="h-4 w-4 accent-accent"
                      />
                      <span className="text-sm text-text-primary">{t(mod.label)}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
                <button
                  onClick={handleModulesSave}
                  disabled={updateModules.isPending}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                  {updateModules.isPending ? t('common.loading') : t('common.save')}
                </button>
                {updateModules.isSuccess && (
                  <span className="text-xs text-success">{t('settings.saved')}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="theme">
          <SettingsCard
            title={t('settings.theme.title')}
            subtitle={t('settings.theme.subtitle')}
            onSave={() => {}}
            isPending={false}
            isSuccess={false}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    {t('settings.theme.primaryDark')}
                  </label>
                  <select
                    value={primaryDark}
                    onChange={(e) => setPrimaryDark(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                  >
                    {themeOptions.filter((t) => t.group === 'dark').map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">
                    {t('settings.theme.primaryLight')}
                  </label>
                  <select
                    value={primaryLight}
                    onChange={(e) => setPrimaryLight(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                  >
                    {themeOptions.filter((t) => t.group === 'light').map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </SettingsCard>
        </section>

        <section id="system">
          <SettingsCard
            title={t('settings.system.title')}
            subtitle={t('settings.system.subtitle')}
            onSave={handleSystemSave}
            isPending={updateTenant.isPending}
            isSuccess={updateTenant.isSuccess}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <InputField
                  id="sessionTimeout"
                  label={t('settings.system.sessionTimeout')}
                  type="number"
                  min={1}
                  value={sessionTimeout}
                  onChange={setSessionTimeout}
                />
              </div>
              <CheckboxField id="enableAudit" label={t('settings.system.enableAudit')} checked={enableAudit} onChange={setEnableAudit} />
            </div>
          </SettingsCard>
        </section>

        <section id="sales">
          <SettingsCard
            title={t('settings.sales.title')}
            subtitle={t('settings.sales.subtitle')}
            onSave={handleSalesSave}
            isPending={updateTenant.isPending}
            isSuccess={updateTenant.isSuccess}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <SelectField
                  id="defaultDocType"
                  label={t('settings.sales.defaultDocType')}
                  value={defaultDocType}
                  onChange={setDefaultDocType}
                  options={[
                    { value: 'sales_invoice', label: t('settings.sales.docTypes.salesInvoice') },
                    { value: 'delivery_order', label: t('settings.sales.docTypes.deliveryOrder') },
                  ]}
                />
                <SelectField
                  id="defaultPaymentTerms"
                  label={t('settings.sales.defaultPaymentTerms')}
                  value={defaultPaymentTerms}
                  onChange={setDefaultPaymentTerms}
                  options={[
                    { value: 'cash', label: t('settings.sales.paymentTerms.cash') },
                    { value: 'credit_15', label: t('settings.sales.paymentTerms.credit15') },
                    { value: 'credit_30', label: t('settings.sales.paymentTerms.credit30') },
                    { value: 'credit_45', label: t('settings.sales.paymentTerms.credit45') },
                  ]}
                />
              </div>
              <InputField
                id="receiptFooter"
                label={t('settings.sales.receiptFooter')}
                placeholder={t('settings.sales.receiptFooterPlaceholder')}
                value={receiptFooter}
                onChange={setReceiptFooter}
              />
              <CheckboxField id="enableCommissions" label={t('settings.sales.enableCommissions')} checked={enableCommissions} onChange={setEnableCommissions} />
              <CheckboxField id="autoInvoiceNumbering" label={t('settings.sales.autoInvoiceNumbering')} checked={autoInvoiceNumbering} onChange={setAutoInvoiceNumbering} />
            </div>
          </SettingsCard>
        </section>

        <section id="fiscal">
          <SettingsCard
            title={t('settings.fiscal.title')}
            subtitle={t('settings.fiscal.subtitle')}
            onSave={handleFiscalSave}
            isPending={updateTenant.isPending}
            isSuccess={updateTenant.isSuccess}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <InputField
                  id="defaultVatRate"
                  label={t('settings.fiscal.defaultVatRate')}
                  type="number"
                  min={0}
                  max={100}
                  value={defaultVatRate}
                  onChange={setDefaultVatRate}
                />
                <SelectField
                  id="defaultContributorType"
                  label={t('settings.fiscal.defaultContributorType')}
                  value={defaultContributorType}
                  onChange={setDefaultContributorType}
                  options={[
                    { value: 'ordinary', label: t('settings.fiscal.contributorTypes.ordinary') },
                    { value: 'formal', label: t('settings.fiscal.contributorTypes.formal') },
                    { value: 'special', label: t('settings.fiscal.contributorTypes.special') },
                  ]}
                />
              </div>
              <CheckboxField id="autoWithholding" label={t('settings.fiscal.autoWithholding')} checked={autoWithholding} onChange={setAutoWithholding} />
            </div>
          </SettingsCard>
        </section>

        <section id="inventory">
          <SettingsCard
            title={t('settings.inventory.title')}
            subtitle={t('settings.inventory.subtitle')}
            onSave={handleInventorySave}
            isPending={updateTenant.isPending}
            isSuccess={updateTenant.isSuccess}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <SelectField
                  id="defaultCostMethod"
                  label={t('settings.inventory.defaultCostMethod')}
                  value={defaultCostMethod}
                  onChange={setDefaultCostMethod}
                  options={[
                    { value: 'weighted_average', label: t('settings.inventory.costMethods.weightedAverage') },
                    { value: 'fifo', label: t('settings.inventory.costMethods.fifo') },
                    { value: 'standard', label: t('settings.inventory.costMethods.standard') },
                  ]}
                />
              </div>
              <CheckboxField id="allowNegativeStock" label={t('settings.inventory.allowNegativeStock')} checked={allowNegativeStock} onChange={setAllowNegativeStock} />
            </div>
          </SettingsCard>
        </section>

        <section id="financial">
          <SettingsCard
            title={t('settings.financial.title')}
            subtitle={t('settings.financial.subtitle')}
            onSave={handleFinancialSave}
            isPending={updateTenant.isPending}
            isSuccess={updateTenant.isSuccess}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <SelectField
                  id="foreignCurrency"
                  label={t('settings.financial.foreignCurrency')}
                  value={foreignCurrency}
                  onChange={setForeignCurrency}
                  options={[
                    { value: 'USD', label: 'USD — Dólar' },
                    { value: 'EUR', label: 'EUR — Euro' },
                    { value: 'COP', label: 'COP — Peso Colombiano' },
                    { value: 'PYG', label: 'PYG — Guaraní' },
                  ]}
                />
                <SelectField
                  id="exchangeRateSource"
                  label={t('settings.financial.exchangeRateSource')}
                  value={exchangeRateSource}
                  onChange={setExchangeRateSource}
                  options={[
                    { value: 'bcv', label: t('settings.financial.rateSources.bcv') },
                    { value: 'trm', label: t('settings.financial.rateSources.trm') },
                    { value: 'manual', label: t('settings.financial.rateSources.manual') },
                  ]}
                />
                <SelectField
                  id="exchangeRateProviders"
                  label="Orden de proveedores externos"
                  value={exchangeRateProviders}
                  onChange={setExchangeRateProviders}
                  options={[
                    { value: 'automatic', label: 'Automático con respaldo' },
                    { value: 'open-er-api', label: 'Open ER API primero' },
                    { value: 'frankfurter', label: 'Frankfurter primero' },
                    { value: 'custom', label: 'Proveedores personalizados' },
                    { value: 'manual', label: 'Solo registro manual' },
                  ]}
                />
              </div>
              <CheckboxField id="multicurrency" label={t('settings.financial.multicurrency')} checked={multicurrency} onChange={setMulticurrency} />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">APIs personalizadas</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      URL con {'{from}'} y {'{to}'}; ruta JSON de la tasa, por ejemplo rates.VES.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomRateProviders((providers) => [
                      ...providers,
                      {
                        id: `custom-${Date.now()}`,
                        name: '',
                        urlTemplate: '',
                        ratePath: '',
                        datePath: '',
                        apiKeyHeader: '',
                        apiKey: '',
                        enabled: true,
                      },
                    ])}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover"
                  >
                    <Plus size={15} />
                    Agregar API
                  </button>
                </div>
                {customRateProviders.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-text-secondary">
                    No hay proveedores personalizados configurados.
                  </p>
                )}
                {customRateProviders.map((provider, index) => (
                  <div key={provider.id} className="space-y-3 rounded-lg border border-border bg-canvas p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-xs font-medium text-text-secondary">
                        <span>Nombre</span>
                        <input
                          value={provider.name}
                          onChange={(e) => setCustomRateProviders((providers) => providers.map((item, i) => i === index ? { ...item, name: e.target.value } : item))}
                          placeholder="Mi proveedor"
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-medium text-text-secondary">
                        <span>ID interno</span>
                        <input
                          value={provider.id}
                          onChange={(e) => setCustomRateProviders((providers) => providers.map((item, i) => i === index ? { ...item, id: e.target.value.trim().replace(/\s+/g, '-') } : item))}
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-medium text-text-secondary md:col-span-2">
                        <span>URL</span>
                        <input
                          value={provider.urlTemplate}
                          onChange={(e) => setCustomRateProviders((providers) => providers.map((item, i) => i === index ? { ...item, urlTemplate: e.target.value } : item))}
                          placeholder="https://api.example.com/latest/{from}/{to}"
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-medium text-text-secondary">
                        <span>Ruta de la tasa</span>
                        <input
                          value={provider.ratePath}
                          onChange={(e) => setCustomRateProviders((providers) => providers.map((item, i) => i === index ? { ...item, ratePath: e.target.value } : item))}
                          placeholder="rates.VES"
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-medium text-text-secondary">
                        <span>Ruta de fecha (opcional)</span>
                        <input
                          value={provider.datePath}
                          onChange={(e) => setCustomRateProviders((providers) => providers.map((item, i) => i === index ? { ...item, datePath: e.target.value } : item))}
                          placeholder="date"
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-medium text-text-secondary">
                        <span>Encabezado API key (opcional)</span>
                        <input
                          value={provider.apiKeyHeader}
                          onChange={(e) => setCustomRateProviders((providers) => providers.map((item, i) => i === index ? { ...item, apiKeyHeader: e.target.value } : item))}
                          placeholder="X-API-Key"
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-medium text-text-secondary">
                        <span>API key (opcional)</span>
                        <input
                          type="password"
                          value={provider.apiKey}
                          onChange={(e) => setCustomRateProviders((providers) => providers.map((item, i) => i === index ? { ...item, apiKey: e.target.value } : item))}
                          placeholder="••••••••"
                          autoComplete="off"
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                        />
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <CheckboxField
                        id={`provider-enabled-${provider.id}`}
                        label="Proveedor habilitado"
                        checked={provider.enabled}
                        onChange={(enabled) => setCustomRateProviders((providers) => providers.map((item, i) => i === index ? { ...item, enabled } : item))}
                      />
                      <button
                        type="button"
                        onClick={() => setCustomRateProviders((providers) => providers.filter((_, i) => i !== index))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-error-alpha hover:text-error"
                        aria-label={`Eliminar proveedor ${provider.name || index + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/localization/currency-rates')}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-canvas px-4 py-3 text-left text-sm text-text-primary transition-colors hover:border-accent hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <span>
                  <span className="block font-medium">{t('localization.currencyRates')}</span>
                  <span className="mt-0.5 block text-xs text-text-secondary">Registra y consulta las tasas históricas por moneda</span>
                </span>
                <ArrowRight size={16} className="text-accent" />
              </button>
            </div>
          </SettingsCard>
        </section>
      </div>
    </div>
  );
}

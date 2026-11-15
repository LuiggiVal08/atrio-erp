import { useEffect, useMemo, useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Star, Warehouse as WarehouseIcon } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Skeleton } from '@/core/components/Skeleton';
import { toastService } from '@/core/services/toast-service';
import { applyServerErrors, resolveServerErrorMessage, FormInput, FormSelect } from '@/shared/form';
import { warehouseFormSchema, type WarehouseFormValues } from '@/shared/validation/warehouse';
import { useBranches } from '../hooks/useBranches';
import { useUpdateWarehouse } from '../hooks/useUpdateWarehouse';
import {
  useDefaultWarehouse,
  useSetDefaultWarehouse,
  useWarehouse,
  useWarehouseSummary,
} from '../hooks/useWarehouses';
import { StorageLocationTree } from '../components/StorageLocationTree';
import { WarehouseStockTab } from '../components/WarehouseStockTab';

type TabKey = 'general' | 'locations';

const TABS: TabKey[] = ['general', 'locations'];

export function WarehouseDetailView() {
  const { id = '' } = useParams();
  const { t, locale } = useTranslation();
  const warehouseQuery = useWarehouse(id);
  const { data: warehouse, isLoading, isError, error, refetch, isFetching } = warehouseQuery;
  const summaryQuery = useWarehouseSummary(id);
  const { data: summary, isLoading: summaryLoading } = summaryQuery;
  const defaultQuery = useDefaultWarehouse();
  const { data: defaultWarehouse } = defaultQuery;
  const branchesQuery = useBranches(true);
  const { data: branches = [] } = branchesQuery;
  const readFailure = locale === 'en' ? 'Could not load warehouse data. Try again.' : 'No se pudieron cargar los datos del almacén. Reintenta.';
  const updateWarehouse = useUpdateWarehouse();
  const setDefaultWarehouse = useSetDefaultWarehouse();
  const [tab, setTab] = useState<TabKey>('general');
  const [editing, setEditing] = useState(false);
  const [serverError, setServerError] = useState('');

  const initialValues = useMemo<WarehouseFormValues>(() => ({
    name: warehouse?.name ?? '',
    code: warehouse?.code ?? '',
    branchId: warehouse?.branchId ?? '',
  }), [warehouse?.id, warehouse?.name, warehouse?.code, warehouse?.branchId]);

  const form = useForm({
    // reset() also changes TanStack defaults. Passing empty defaults on the next
    // render would reinitialize untouched, conditionally mounted bindings.
    defaultValues: initialValues,
    validators: { onSubmit: warehouseFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await updateWarehouse.mutateAsync({
          id,
          data: {
            name: value.name.trim(),
            code: value.code.trim() || null,
            branchId: value.branchId || null,
          },
        });
        toastService.success(t('inventory.warehouseView.saved'));
        setEditing(false);
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const selectedBranchId = useStore(form.store, (state) => state.values.branchId);

  useEffect(() => {
    if (!editing) form.reset(initialValues);
  }, [form, initialValues, editing]);

  if (isLoading) {
    return (
      <div className="grid gap-4 p-6">
        <Skeleton variant="rect" height={56} />
        <Skeleton variant="rect" height={220} />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="grid place-items-center gap-3 p-10 text-center">
        <p role={isError ? 'alert' : undefined} className="text-sm text-text-secondary">
          {(error as { response?: { status?: number } })?.response?.status === 404
            ? t('inventory.warehouseView.notFound') : readFailure}
        </p>
        <button type="button" onClick={() => void refetch()} disabled={isFetching} className="text-xs font-semibold text-accent disabled:opacity-50">
          {isFetching ? t('common.loading') : t('common.retry')}
        </button>
        <Link to="/inventory/warehouses" className="text-xs font-semibold text-accent hover:underline">
          {t('inventory.warehouseView.backToWarehouses')}
        </Link>
      </div>
    );
  }

  const isDefault = defaultWarehouse?.id === warehouse.id;
  const branchInactive = !!warehouse.branchId && !branches.some((branch) => branch.id === warehouse.branchId && branch.isActive);
  const actionBlocked = editing || updateWarehouse.isPending || setDefaultWarehouse.isPending;
  const deactivateBlocked = warehouse.isActive && (isDefault || defaultQuery.isPending || defaultQuery.isError);
  const reactivateBlocked = !warehouse.isActive && !!warehouse.branchId && (branchInactive || branchesQuery.isPending || branchesQuery.isError);
  const runAction = async (action: () => Promise<unknown>) => {
    setServerError('');
    try { await action(); } catch (actionError) {
      setServerError(resolveServerErrorMessage(applyServerErrors(form, actionError), t('common.saveUnconfirmed')));
    }
  };
  const branchName = branches.find((branch) => branch.id === warehouse.branchId)?.name ?? null;

  const detailItems: { label: string; value: string | null; mono?: boolean }[] = [
    { label: t('inventory.warehouseView.name'), value: warehouse.name },
    { label: t('inventory.warehouseView.code'), value: warehouse.code, mono: true },
    { label: t('inventory.warehouseView.branch'), value: branchName },
  ];

  const startEditing = () => {
    form.reset(initialValues);
    setServerError('');
    setEditing(true);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-6 pt-4">
        <Link
          to="/inventory/warehouses"
          className="mb-2 inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          {t('inventory.warehouseView.backToWarehouses')}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <WarehouseIcon size={20} aria-hidden="true" className="shrink-0 text-accent" />
              <h1 className="truncate font-brand text-lg font-extrabold text-text-primary">
                {warehouse.name}
              </h1>
              {warehouse.code && (
                <span className="rounded bg-surface-hover px-2 py-0.5 font-mono text-[11px] text-text-secondary">
                  {warehouse.code}
                </span>
              )}
              {isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-alpha px-2 py-0.5 text-[10px] font-semibold text-accent">
                  <Star size={10} aria-hidden="true" />
                  {t('inventory.warehouseView.defaultBadge')}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${warehouse.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
              >
                {warehouse.isActive ? t('inventory.warehouseView.active') : t('inventory.warehouseView.inactive')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isDefault && (
              <button
                type="button"
                onClick={() => void runAction(() => setDefaultWarehouse.mutateAsync(warehouse.id))}
                disabled={!warehouse.isActive || branchInactive || branchesQuery.isPending || branchesQuery.isError || defaultQuery.isPending || defaultQuery.isError || actionBlocked}
                aria-busy={setDefaultWarehouse.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Star size={13} aria-hidden="true" />
                {t('inventory.warehouseView.setDefault')}
              </button>
            )}
            <button
              type="button"
              onClick={() => void runAction(() => updateWarehouse.mutateAsync({ id: warehouse.id, data: { isActive: !warehouse.isActive } }))}
              disabled={actionBlocked || deactivateBlocked || reactivateBlocked}
              aria-busy={updateWarehouse.isPending}
              title={deactivateBlocked && isDefault
                ? (locale === 'en' ? 'Select another default warehouse before deactivating.' : 'Selecciona otro almacén predeterminado antes de desactivar.')
                : reactivateBlocked ? (locale === 'en' ? 'Activate the branch first.' : 'Activa primero la sucursal.') : undefined}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {warehouse.isActive
                ? t('inventory.warehouseView.deactivate')
                : t('inventory.warehouseView.reactivate')}
            </button>
          </div>
        </div>

        <div
          role="tablist"
          aria-label={t('inventory.warehouseView.tabsAria')}
          className="mt-4 flex gap-1 overflow-x-auto"
        >
          {TABS.map((key) => (
            <button
              key={key}
              id={`tab-${key}`}
              role="tab"
              aria-selected={tab === key}
              aria-controls="warehouse-tabpanel"
              tabIndex={tab === key ? 0 : -1}
              onKeyDown={(event) => {
                const index = TABS.indexOf(key);
                const next = event.key === 'ArrowRight' ? TABS[(index + 1) % TABS.length]
                  : event.key === 'ArrowLeft' ? TABS[(index + TABS.length - 1) % TABS.length]
                    : event.key === 'Home' ? TABS[0] : event.key === 'End' ? TABS[TABS.length - 1] : null;
                if (!next) return;
                event.preventDefault();
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === key
                  ? 'bg-accent-alpha text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {t(`inventory.warehouseView.tab${key[0].toUpperCase()}${key.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      <div
        id="warehouse-tabpanel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto p-6"
      >
        {(isError || branchesQuery.isError || defaultQuery.isError) && (
          <div role="alert" className="mb-4 text-sm text-error">
            {readFailure}
            <button type="button" onClick={() => { void refetch(); void branchesQuery.refetch(); void defaultQuery.refetch(); }} disabled={isFetching || branchesQuery.isFetching || defaultQuery.isFetching} className="ml-3 font-semibold text-accent disabled:opacity-50">{t('common.retry')}</button>
          </div>
        )}
        {!editing && serverError && <p role="alert" className="mb-4 text-sm text-error">{serverError}</p>}
        {tab === 'general' && (
          <div className="grid gap-4">
            <section
              aria-label={t('inventory.warehouseView.detailsTitle')}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-text-primary">
                  {editing
                    ? t('inventory.warehouseView.editTitle')
                    : t('inventory.warehouseView.detailsTitle')}
                </h2>
                {!editing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
                  >
                    <Pencil size={13} aria-hidden="true" />
                    {t('common.edit')}
                  </button>
                )}
              </div>
              {editing ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void form.handleSubmit();
                  }}
                >
                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <FormInput
                      form={form}
                      name="name"
                      label={t('inventory.warehouseView.name')}
                      placeholder={t('inventory.warehouseView.namePlaceholder')}
                      ariaLabel={t('inventory.warehouseView.name')}
                      required
                    />
                    <FormInput
                      form={form}
                      name="code"
                      label={t('inventory.warehouseView.code')}
                      placeholder={t('inventory.warehouseView.codePlaceholder')}
                      ariaLabel={t('inventory.warehouseView.code')}
                    />
                    <FormSelect
                      form={form}
                      name="branchId"
                      label={t('inventory.warehouseView.branch')}
                      ariaLabel={t('inventory.warehouseView.branch')}
                      placeholder={t('inventory.warehouseView.noBranch')}
                      disabled={branchesQuery.isPending || branchesQuery.isError || updateWarehouse.isPending}
                      options={branches.map((branch) => ({ value: branch.id, label: `${branch.name}${branch.isActive ? '' : ` (${t('inventory.branchView.inactive')})`}`, disabled: !branch.isActive }))}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                    <div className="min-w-0 flex-1">
                      {serverError && (
                        <p role="alert" className="text-sm text-error">
                          {serverError}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { form.reset(initialValues); setServerError(''); setEditing(false); }}
                        disabled={updateWarehouse.isPending}
                        className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={updateWarehouse.isPending || branchesQuery.isPending || branchesQuery.isError || (!!selectedBranchId && !branches.some((branch) => branch.id === selectedBranchId && branch.isActive))}
                        aria-busy={updateWarehouse.isPending}
                        className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {t('common.save')}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-3">
                  {detailItems.map((item) => (
                    <div key={item.label} className="min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        {item.label}
                      </dt>
                      <dd
                        className={`mt-0.5 truncate text-sm text-text-primary ${item.mono ? 'font-mono tabular-nums' : ''}`}
                        title={item.value ?? undefined}
                      >
                        {item.value || <span className="text-text-secondary">—</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>

            <WarehouseStockTab summary={summary} isLoading={summaryLoading} isError={summaryQuery.isError} isFetching={summaryQuery.isFetching} onRetry={() => void summaryQuery.refetch()} />
          </div>
        )}

        {tab === 'locations' && <StorageLocationTree warehouseId={warehouse.id} warehouseActive={warehouse.isActive && !branchInactive} />}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Pencil, Plus, Warehouse as WarehouseIcon } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { Modal } from '@/core/components/Modal';
import { Skeleton } from '@/core/components/Skeleton';
import { toastService } from '@/core/services/toast-service';
import {
  applyServerErrors,
  resolveServerErrorMessage,
  FormInput,
  FormPhoneInput,
  FormCombobox,
} from '@/shared/form';
import { useEmployees, employeeDisplayName } from '@/shared/hooks/useEmployees';
import { branchFormSchema, type BranchFormValues } from '@/shared/validation/branch';
import { useBranch, useUpdateBranch, type Branch } from '../hooks/useBranches';
import { useWarehouses } from '../hooks/useWarehouses';

function serverMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) {
    return message.filter((entry): entry is string => typeof entry === 'string').join(' · ');
  }
  if (typeof message === 'string' && message) return message;
  return fallback;
}

export function BranchDetailView() {
  const { id = '' } = useParams();
  const { t, locale } = useTranslation();
  const [searchParams] = useSearchParams();
  const { data: branch, isLoading, isError, error, refetch, isFetching } = useBranch(id);
  const warehousesQuery = useWarehouses(true);
  const { data: warehouses = [], isLoading: warehousesLoading } = warehousesQuery;
  const employeesQuery = useEmployees();
  const { data: employees = [] } = employeesQuery;
  const readFailure = locale === 'en' ? 'Could not load branch data. Try again.' : 'No se pudieron cargar los datos de la sucursal. Reintenta.';
  const updateBranch = useUpdateBranch();
  const [editOpen, setEditOpen] = useState(false);
  const warehousesRef = useRef<HTMLElement>(null);

  const branchWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.branchId === id),
    [warehouses, id],
  );

  const activeWarehouses = useMemo(
    () => branchWarehouses.filter((warehouse) => warehouse.isActive).length,
    [branchWarehouses],
  );

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        name: employeeDisplayName(employee),
      })),
    [employees],
  );

  const managerName = branch?.managerEmployeeId
    ? (employeeOptions.find((employee) => employee.id === branch.managerEmployeeId)?.name ?? null)
    : null;

  useEffect(() => {
    if (searchParams.get('tab') === 'warehouses' && !warehousesLoading) {
      warehousesRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [searchParams, warehousesLoading]);

  const toggleActive = async () => {
    if (!branch) return;
    try {
      await updateBranch.mutateAsync({
        id: branch.id,
        data: { isActive: !branch.isActive },
      });
    } catch (error) {
      toastService.error(serverMessage(error, t('common.saveUnconfirmed')));
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 p-6">
        <Skeleton variant="rect" height={56} />
        <Skeleton variant="rect" height={220} />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="grid place-items-center gap-3 p-10 text-center">
        <p role={isError ? 'alert' : undefined} className="text-sm text-text-secondary">
          {(error as { response?: { status?: number } })?.response?.status === 404 ? t('inventory.branchView.notFound') : readFailure}
        </p>
        <button type="button" onClick={() => void refetch()} disabled={isFetching} className="text-xs font-semibold text-accent disabled:opacity-50">{isFetching ? t('common.loading') : t('common.retry')}</button>
        <Link
          to="/inventory/branches"
          className="text-xs font-semibold text-accent hover:underline"
        >
          {t('inventory.branchView.backToBranches')}
        </Link>
      </div>
    );
  }

  const blockedDeactivation = branch.isActive && (activeWarehouses > 0 || warehousesQuery.isPending || warehousesQuery.isError);

  const detailItems: { label: string; value: string | null; mono?: boolean }[] = [
    { label: t('inventory.branchView.name'), value: branch.name },
    { label: t('inventory.branchView.code'), value: branch.code, mono: true },
    { label: t('inventory.branchView.city'), value: branch.city },
    { label: t('inventory.branchView.state'), value: branch.state },
    { label: t('inventory.branchView.address'), value: branch.address },
    { label: t('inventory.branchView.phone'), value: branch.phone, mono: true },
    { label: t('inventory.branchView.manager'), value: managerName },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-6 pb-4 pt-4">
        <Link
          to="/inventory/branches"
          className="mb-2 inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          {t('inventory.branchView.backToBranches')}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Building2 size={20} aria-hidden="true" className="shrink-0 text-accent" />
              <h1 className="truncate font-brand text-lg font-extrabold text-text-primary">
                {branch.name}
              </h1>
              {branch.code && (
                <span className="rounded bg-surface-hover px-2 py-0.5 font-mono text-[11px] text-text-secondary">
                  {branch.code}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${branch.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
              >
                {branch.isActive
                  ? t('inventory.branchView.active')
                  : t('inventory.branchView.inactive')}
              </span>
            </div>
            {(branch.city || branch.state) && (
              <p className="mt-1 text-xs text-text-secondary">
                {[branch.city, branch.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              <Pencil size={13} aria-hidden="true" />
              {t('common.edit')}
            </button>
            <button
              type="button"
              onClick={() => void toggleActive()}
              disabled={blockedDeactivation || updateBranch.isPending || editOpen}
              aria-busy={updateBranch.isPending}
              title={blockedDeactivation ? t('inventory.branchView.deleteBlocked') : undefined}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {branch.isActive
                ? t('inventory.branchView.deactivate')
                : t('inventory.branchView.reactivate')}
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid w-full max-w-3xl gap-6">
          {(isError || employeesQuery.isError) && <div role="alert" className="text-sm text-error">
            {readFailure}
            <button type="button" onClick={() => { void refetch(); void employeesQuery.refetch(); }} disabled={isFetching || employeesQuery.isFetching} className="ml-3 font-semibold text-accent disabled:opacity-50">{t('common.retry')}</button>
          </div>}
          <section
            aria-label={t('inventory.branchView.detailsTitle')}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-text-primary">
                {t('inventory.branchView.detailsTitle')}
              </h2>
            </div>
            <dl className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
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
          </section>

          <section ref={warehousesRef} aria-label={t('inventory.branchView.warehousesTitle')}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-text-primary">
                  {t('inventory.branchView.warehousesTitle')}
                </h2>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {t('inventory.branchView.warehousesHint')}
                </p>
              </div>
              {branch.isActive && <Link
                to={`/inventory/warehouses?branch=${branch.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
              >
                <Plus size={13} aria-hidden="true" />
                {t('inventory.branchView.newWarehouse')}
              </Link>}
            </div>

            {!branch.isActive && <p className="mb-3 text-xs text-text-secondary">{locale === 'en' ? 'Activate the branch before adding warehouses.' : 'Activa la sucursal antes de agregar almacenes.'}</p>}
            {warehousesQuery.isError && <div role="alert" className="mb-3 text-sm text-error">
              {locale === 'en' ? 'Could not load branch warehouses.' : 'No se pudieron cargar los almacenes de la sucursal.'}
              <button type="button" onClick={() => void warehousesQuery.refetch()} disabled={warehousesQuery.isFetching} className="ml-3 font-semibold text-accent disabled:opacity-50">{t('common.retry')}</button>
            </div>}
            {warehousesQuery.isFetching && warehouses.length > 0 && <p role="status" className="mb-3 text-xs text-text-secondary">{t('common.loading')}</p>}
            {warehousesLoading ? (
              <div className="grid gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} variant="rect" height={56} />
                ))}
              </div>
            ) : warehousesQuery.isError && warehouses.length === 0 ? null : branchWarehouses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
                <WarehouseIcon
                  size={28}
                  aria-hidden="true"
                  className="mx-auto text-text-secondary"
                />
                <p className="mt-2 text-sm text-text-secondary">
                  {t('inventory.branchView.noWarehouses')}
                </p>
              </div>
            ) : (
              <ul className="overflow-hidden rounded-xl border border-border bg-surface">
                {branchWarehouses.map((warehouse) => (
                  <li key={warehouse.id} className="border-b border-border last:border-b-0">
                    <Link
                      to={`/inventory/warehouses/${warehouse.id}`}
                      aria-label={`${t('inventory.branchView.openWarehouse')}: ${warehouse.name}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <WarehouseIcon
                          size={15}
                          aria-hidden="true"
                          className="shrink-0 text-accent"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-text-primary">
                            {warehouse.name}
                          </span>
                          {warehouse.code && (
                            <span className="block font-mono text-[11px] text-text-secondary">
                              {warehouse.code}
                            </span>
                          )}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${warehouse.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
                      >
                        {warehouse.isActive
                          ? t('inventory.branchView.active')
                          : t('inventory.branchView.inactive')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {editOpen && (
        <BranchEditModal
          branch={branch}
          employeeOptions={employeeOptions}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

function BranchEditModal({
  branch,
  employeeOptions,
  onClose,
}: {
  branch: Branch;
  employeeOptions: { id: string; name: string }[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const updateBranch = useUpdateBranch();
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues: {
      name: branch.name,
      code: branch.code ?? '',
      address: branch.address ?? '',
      city: branch.city ?? '',
      state: branch.state ?? '',
      phone: branch.phone ?? '',
      managerEmployeeId: branch.managerEmployeeId ?? '',
    } satisfies BranchFormValues,
    validators: { onSubmit: branchFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await updateBranch.mutateAsync({
          id: branch.id,
          data: {
            name: value.name.trim(),
            code: value.code.trim() || null,
            address: value.address.trim() || null,
            city: value.city.trim() || null,
            state: value.state.trim() || null,
            phone: value.phone.trim() || null,
            managerEmployeeId: value.managerEmployeeId || null,
          },
        });
        toastService.success(t('inventory.branchView.saved'));
        onClose();
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  return (
    <Modal open onClose={onClose} title={t('inventory.branchView.editTitle')} size="lg">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className="grid gap-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput
            form={form}
            name="name"
            label={t('inventory.branchView.name')}
            placeholder={t('inventory.branchView.namePlaceholder')}
            ariaLabel={t('inventory.branchView.name')}
            required
          />
          <FormInput
            form={form}
            name="code"
            label={t('inventory.branchView.code')}
            placeholder={t('inventory.branchView.codePlaceholder')}
            ariaLabel={t('inventory.branchView.code')}
          />
          <FormInput
            form={form}
            name="city"
            label={t('inventory.branchView.city')}
            placeholder={t('inventory.branchView.cityPlaceholder')}
            ariaLabel={t('inventory.branchView.city')}
          />
          <FormInput
            form={form}
            name="state"
            label={t('inventory.branchView.state')}
            placeholder={t('inventory.branchView.statePlaceholder')}
            ariaLabel={t('inventory.branchView.state')}
          />
          <FormInput
            form={form}
            name="address"
            label={t('inventory.branchView.address')}
            placeholder={t('inventory.branchView.addressPlaceholder')}
            ariaLabel={t('inventory.branchView.address')}
          />
          <FormPhoneInput
            form={form}
            name="phone"
            label={t('inventory.branchView.phone')}
          />
          <FormCombobox
            form={form}
            name="managerEmployeeId"
            label={t('inventory.branchView.manager')}
            placeholder={t('inventory.branchView.managerPlaceholder')}
            options={employeeOptions}
            className="sm:col-span-2"
          />
        </div>
        {serverError && (
          <p role="alert" className="text-sm text-error">
            {serverError}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={updateBranch.isPending}
            aria-busy={updateBranch.isPending}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

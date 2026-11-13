import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useForm, useStore } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePaymentMethods, type PaymentMethod } from '@/modules/cash/hooks/usePaymentMethods';
import { useCreatePaymentMethod } from '@/modules/cash/hooks/useCreatePaymentMethod';
import { useUpdatePaymentMethod } from '@/modules/cash/hooks/useUpdatePaymentMethod';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { toastService } from '@/core/services/toast-service';
import { applyServerErrors, resolveServerErrorMessage, clearServerErrors, FormInput, FormSelect } from '@/shared/form';
import {
  paymentMethodFormSchema,
  type PaymentMethodFormValues,
} from '@/shared/validation/payment-method';

const paymentTypeLabels: Record<PaymentMethod['type'], string> = {
  cash: 'Efectivo',
  digital: 'Digital',
  card: 'Punto / tarjeta',
  other: 'Otro',
};

const defaultValues: PaymentMethodFormValues = {
  name: '',
  type: 'cash',
  currency: 'VED',
  commissionPercent: undefined,
};

export function PaymentMethodListView() {
  const { t } = useTranslation();
  const { data: methods, isLoading, isError, refetch, isFetching } = usePaymentMethods();
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues,
    validators: { onSubmit: paymentMethodFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      const parsedPercent = value.commissionPercent ?? null;
      const commissionRate =
        value.type === 'cash' || parsedPercent === null ? null : parsedPercent / 100;
      const methodData = {
        name: value.name.trim(),
        type: value.type,
        currency: value.type === 'cash' ? undefined : value.currency,
        commissionRate,
        isActive,
      };

      try {
        if (editingMethod) {
          await updateMethod.mutateAsync({ id: editingMethod.id, data: methodData });
          toastService.success('Método actualizado', 'Los cambios se guardaron correctamente.');
        } else {
          await createMethod.mutateAsync({
            name: methodData.name,
            type: methodData.type,
            currency: methodData.currency,
            commissionRate: methodData.commissionRate ?? undefined,
          });
          toastService.success('Método creado', 'El método de pago está disponible.');
        }
        form.reset();
        setEditingMethod(null);
        setIsActive(true);
        setShowForm(false);
      } catch (error) {
        const timedOut =
          isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
        if (timedOut) {
          await refetch();
          toastService.error(
            'No se confirmó el cambio',
            'La solicitud agotó el tiempo de espera. Revisa la lista antes de volver a guardar.',
          );
        }

        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const type = useStore(form.store, (state) => state.values.type);

  const closeForm = () => {
    setShowForm(false);
    setEditingMethod(null);
    form.reset();
    setIsActive(true);
    setServerError('');
  };

  const openCreateForm = () => {
    closeForm();
    clearServerErrors(form);
    setServerError('');
    setShowForm(true);
  };

  const openEditForm = (method: PaymentMethod) => {
    clearServerErrors(form);
    setServerError('');
    setEditingMethod(method);
    form.reset({
      name: method.name,
      type: method.type,
      currency: method.currency || 'VED',
      commissionPercent:
        method.commissionRate === null ? undefined : method.commissionRate * 100,
    });
    setIsActive(method.isActive);
    setShowForm(true);
  };

  const pagination = usePagination(methods ?? []);

  const columns: GridColumn<PaymentMethod>[] = [
    { key: 'name', label: 'Método', sortable: true },
    {
      key: 'type',
      label: 'Tipo',
      width: 130,
      render: (v) => paymentTypeLabels[v as PaymentMethod['type']],
    },
    {
      key: 'currency',
      label: 'Moneda',
      width: 90,
      render: (v, row) => (row.type === 'cash' ? '—' : (v as string) || '—'),
    },
    {
      key: 'commissionRate',
      label: 'Comisión',
      width: 100,
      align: 'right',
      render: (v) =>
        v === null || v === undefined
          ? '—'
          : `${(Number(v) * 100).toLocaleString('es-VE', { maximumFractionDigits: 2 })}%`,
    },
    { key: 'isActive', label: 'Estado', width: 90, render: (v) => (v ? 'Activo' : 'Inactivo') },
    {
      key: 'actions',
      label: '',
      width: 100,
      align: 'right',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => openEditForm(row)}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-primary hover:border-accent hover:text-accent"
        >
          Editar
        </button>
      ),
    },
  ];

  return (
    <ListPage
      title={t('cash.paymentMethods')}
      subtitle={t('cash.paymentMethodsSubtitle')}
      contentClassName="gap-4"
      onRefresh={refetch}
      refreshing={isFetching}
      pagination={
        <ListPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      }
      actions={
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
        >
          {showForm ? t('common.cancel') : `+ ${t('common.create')}`}
        </button>
      }
    >
      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="shrink-0 rounded-lg border border-border bg-surface p-3"
        >
          <h2 className="mb-3 text-sm font-semibold text-text-primary">
            {editingMethod ? 'Editar método de pago' : 'Nuevo método de pago'}
          </h2>
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormInput
              form={form}
              name="name"
              label="Nombre"
              placeholder="Ej. Pago móvil"
              required
            />
            <FormSelect
              form={form}
              name="type"
              label="Tipo"
              options={[
                { value: 'cash', label: 'Efectivo' },
                { value: 'digital', label: 'Digital / pago móvil' },
                { value: 'card', label: 'Punto / tarjeta' },
                { value: 'other', label: 'Otro' },
              ]}
            />
            {type !== 'cash' && (
              <>
                <FormSelect
                  form={form}
                  name="currency"
                  label="Moneda"
                  options={[
                    { value: 'VED', label: 'VES' },
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'COP', label: 'COP' },
                    { value: 'BRL', label: 'BRL' },
                  ]}
                />
                <FormInput
                  form={form}
                  name="commissionPercent"
                  label="Comisión (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  placeholder="0"
                />
              </>
            )}
            {editingMethod && (
              <label className="flex items-center gap-2 pb-1 text-xs text-text-primary">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-accent"
                />
                Método activo
              </label>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMethod.isPending || updateMethod.isPending}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {createMethod.isPending || updateMethod.isPending
                ? t('common.loading')
                : t('common.save')}
            </button>
          </div>
          {serverError && (
            <p role="alert" className="mt-2 text-xs text-red-500">
              {serverError}
            </p>
          )}
        </form>
      )}
      {isError ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-text-secondary">No se pudieron cargar los métodos de pago.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:border-accent hover:text-accent"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <VirtualGrid
          data={pagination.pageItems}
          columns={columns}
          loading={isLoading}
          emptyMessage="No hay métodos de pago"
        />
      )}
    </ListPage>
  );
}

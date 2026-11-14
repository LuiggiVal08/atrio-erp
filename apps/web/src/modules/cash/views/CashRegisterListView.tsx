import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useForm } from '@tanstack/react-form';
import { useQueries } from '@tanstack/react-query';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCashRegisters, type CashRegister } from '@/modules/cash/hooks/useCashRegisters';
import { useCreateCashRegister } from '@/modules/cash/hooks/useCreateCashRegister';
import { useOpenSession } from '@/modules/sales/hooks/usePosSessions';
import { toastService } from '@/core/services/toast-service';
import type { CashRegisterDetail } from '@/modules/cash/hooks/useCashRegisterDetail';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { Modal } from '@/core/components/Modal';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/lib/api/client';
import { applyServerErrors, resolveServerErrorMessage, clearServerErrors, FormInput } from '@/shared/form';
import {
  cashRegisterFormSchema,
  type CashRegisterFormValues,
} from '@/shared/validation/cash-register';

const defaultValues: CashRegisterFormValues = { name: '', location: '' };

export function CashRegisterListView() {
  const { t } = useTranslation();
  const { data: registers, isLoading, refetch, isFetching } = useCashRegisters();
  const openSessions = useQueries({
    queries: (registers ?? []).map((register) => ({
      queryKey: ['cash-register-detail', register.id],
      queryFn: async () => {
        const response = await api.get(`/cash-payments/registers/${register.id}/detail`);
        return (response.data?.data || response.data) as CashRegisterDetail;
      },
      refetchInterval: 30_000,
    })),
  });
  const createRegister = useCreateCashRegister();
  const openSession = useOpenSession();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [openingRegisterId, setOpeningRegisterId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [openingDenominations, setOpeningDenominations] = useState<
    Record<string, Record<string, number>>
  >({});

  const form = useForm({
    defaultValues,
    validators: { onSubmit: cashRegisterFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createRegister.mutateAsync({
          name: value.name.trim(),
          location: value.location.trim(),
        });
        form.reset();
        setShowForm(false);
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const toggleForm = () => {
    clearServerErrors(form);
    setServerError('');
    setShowForm((visible) => !visible);
  };

  const handleOpenSession = async () => {
    if (!openingRegisterId) return;
    try {
      await openSession.mutateAsync({
        cashRegisterId: openingRegisterId,
        openingBalance: Number(openingBalance) || 0,
        openingDenominations,
      });
      setOpeningRegisterId('');
      setOpeningBalance('0');
      setOpeningDenominations({});
    } catch (error) {
      const message = isAxiosError<{ message?: string | string[] }>(error)
        ? error.response?.data?.message
        : undefined;
      toastService.error(
        'No se pudo abrir la caja',
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Inténtalo de nuevo y verifica la respuesta del servidor.',
      );
    }
  };

  const handleStartOpening = (registerId: string) => {
    const denominations = registerDetails[registerId]?.previousClosing?.closingDenominations ?? {};
    setOpeningDenominations(structuredClone(denominations));
    const vesTotal = Object.entries(denominations.VES ?? {}).reduce(
      (sum, [denomination, quantity]) => sum + Number(denomination) * Number(quantity),
      0,
    );
    setOpeningBalance(String(vesTotal));
    setOpeningRegisterId(registerId);
  };

  const currencySummary = (amounts: Array<{ currency: string; amount: number }>) =>
    amounts
      .filter(({ amount }) => amount !== 0)
      .map(
        ({ currency, amount }) =>
          `${currency === 'VED' ? 'VES' : currency.toUpperCase()} ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
      )
      .join(' · ');

  const previousCashSummary = (registerId: string) => {
    const denominations = registerDetails[registerId]?.previousClosing?.closingDenominations;
    if (!denominations) return '';
    return currencySummary(
      Object.entries(denominations).map(([currency, denominationsByValue]) => ({
        currency,
        amount: Object.entries(denominationsByValue).reduce(
          (sum, [denomination, quantity]) => sum + Number(denomination) * Number(quantity),
          0,
        ),
      })),
    );
  };

  const registerDetails = Object.fromEntries(
    (registers ?? []).map((register, index) => [register.id, openSessions[index]?.data]),
  );
  const openingRegister = registers?.find((register) => register.id === openingRegisterId);
  const openingPreviousClosing = registerDetails[openingRegisterId]?.previousClosing;

  const handleOpeningDenomination = (currency: string, denomination: number, value: string) => {
    const next = structuredClone(openingDenominations);
    next[currency] = { ...(next[currency] ?? {}) };
    next[currency][String(denomination)] = Math.max(0, parseInt(value, 10) || 0);
    setOpeningDenominations(next);
    if (currency === 'VES') {
      const vesTotal = Object.entries(next.VES ?? {}).reduce(
        (sum, [den, quantity]) => sum + Number(den) * Number(quantity),
        0,
      );
      setOpeningBalance(String(vesTotal));
    }
  };

  const pagination = usePagination(registers ?? []);

  const columns: GridColumn<CashRegister>[] = [
    { key: 'name', label: 'Caja', sortable: true },
    { key: 'location', label: 'Ubicación', width: 180, render: (value) => String(value || '-') },
    {
      key: 'balance',
      label: 'Saldo contable',
      width: 150,
      align: 'right',
      render: (value) =>
        `${Number(value || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES`,
    },
    {
      key: 'cashAvailable',
      label: 'Efectivo disponible',
      width: 250,
      render: (_value, row) => {
        const detail = registerDetails[row.id];
        const session = detail?.session;
        const summary = session
          ? currencySummary(detail.totals.cashByCurrency)
          : previousCashSummary(row.id);
        return (
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-text-primary">
              {detail
                ? summary ||
                  `${Number(row.balance || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES`
                : 'Cargando saldo…'}
            </p>
            <p className="text-[10px] text-text-secondary">
              {session
                ? 'En turno abierto'
                : summary
                  ? 'Conteo del último cierre'
                  : 'Saldo contable · sin desglose físico'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'registerStatus',
      label: 'Estado',
      width: 150,
      render: (_value, row) => {
        const detail = registerDetails[row.id];
        if (!detail) return 'Cargando…';
        return detail.session
          ? `Abierta${detail.session.user?.name ? ` · ${detail.session.user.name}` : ''}`
          : 'Disponible';
      },
    },
    {
      key: 'actions',
      label: '',
      width: 190,
      align: 'right',
      render: (_value, row) => {
        const detail = registerDetails[row.id];
        const session = detail?.session;
        if (session) {
          return (
            <button
              type="button"
              onClick={() => navigate('/cash')}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent"
            >
              Ir al arqueo
            </button>
          );
        }
        if (!detail) return <span className="text-xs text-text-secondary">Cargando caja…</span>;
        return (
          <button
            type="button"
            onClick={() => handleStartOpening(row.id)}
            disabled={openSession.isPending}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Revisar y asumir
          </button>
        );
      },
    },
  ];

  return (
    <>
      <ListPage
        title={t('cash.registers')}
        subtitle={t('cash.registersSubtitle')}
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
            onClick={toggleForm}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            + {t('common.create')}
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
            <div className="flex items-center gap-3">
              <FormInput
                form={form}
                name="name"
                placeholder="Nombre de la caja"
                required
                className="flex-1"
              />
              <FormInput
                form={form}
                name="location"
                placeholder="Ubicación"
                className="w-44"
              />
              <button
                type="submit"
                disabled={createRegister.isPending}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
            {serverError && (
              <p role="alert" className="mt-2 text-xs text-red-500">
                {serverError}
              </p>
            )}
          </form>
        )}
        <VirtualGrid
          data={pagination.pageItems}
          columns={columns}
          loading={isLoading}
          emptyMessage="No hay cajas"
        />
      </ListPage>

      <Modal
        open={!!openingRegisterId}
        onClose={() => setOpeningRegisterId('')}
        title={`Revisar caja${openingRegister ? ` · ${openingRegister.name}` : ''}`}
        size="xl"
      >
        <div className="grid gap-4">
          <div className="rounded-lg border border-border bg-canvas p-3">
            <p className="text-sm font-semibold text-text-primary">Efectivo para recibir</p>
            <p className="mt-1 text-xs text-text-secondary">
              {previousCashSummary(openingRegisterId) ||
                `${Number(openingRegister?.balance ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES · saldo contable, sin conteo por denominación`}
            </p>
            {openingPreviousClosing?.closedAt && (
              <p className="mt-1 text-[11px] text-text-secondary">
                Conteo del {new Date(openingPreviousClosing.closedAt).toLocaleString('es-VE')}
              </p>
            )}
            <p className="mt-2 text-xs text-text-secondary">
              Revisa el efectivo físicamente y ajusta las denominaciones antes de asumir el turno.
            </p>
          </div>
          <div>
            <div className="mb-2">
              <p className="text-sm font-semibold text-text-primary">Denominaciones iniciales</p>
              <p className="mt-0.5 text-xs text-text-secondary">
                Se cargaron desde el último cierre; ajusta si hubo cambios.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
              {(['VES', 'USD', 'EUR'] as const).map((currency) => (
                <div key={currency} className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-semibold text-text-primary">{currency}</p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(62px,1fr))] gap-2">
                    {(currency === 'VES'
                      ? [1000, 500, 100, 50, 20, 10, 5, 2, 1]
                      : currency === 'USD'
                        ? [100, 50, 20, 10, 5, 2, 1]
                        : [500, 200, 100, 50, 20, 10, 5]
                    ).map((denomination) => (
                      <label
                        key={denomination}
                        className="grid gap-1 text-[11px] text-text-secondary"
                      >
                        {denomination.toLocaleString('es-VE')}
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={openingDenominations[currency]?.[String(denomination)] || ''}
                          onChange={(event) =>
                            handleOpeningDenomination(currency, denomination, event.target.value)
                          }
                          className="min-w-0 w-full rounded border border-border bg-bg px-1.5 py-1 text-right text-sm tabular-nums text-text-primary"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <label className="grid gap-1 text-xs font-medium text-text-secondary">
            Fondo inicial
            <input
              type="number"
              min="0"
              step="0.01"
              value={openingBalance}
              onChange={(event) => setOpeningBalance(event.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpeningRegisterId('')}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleOpenSession}
              disabled={openSession.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Asumir responsabilidad
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

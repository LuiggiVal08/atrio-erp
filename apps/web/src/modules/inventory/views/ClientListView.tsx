import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useClients } from '@/shared/hooks/useClients';
import { useCreateClient } from '@/modules/client-vendor/hooks/useCreateClient';
import { Drawer } from '@heroui/react';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import {
  applyServerErrors, resolveServerErrorMessage,
  clearServerErrors,
  FormAddressInput,
  FormDocumentInput,
  FormInput,
  FormPhoneInput,
} from '@/shared/form';
import { clientFormSchema, type ClientFormValues } from '@/shared/validation/client';

interface ClientRow {
  id: string;
  legalName: string;
  documentId: string;
  email: string;
  phone: string;
}

const defaultValues: ClientFormValues = {
  legalName: '',
  firstName: '',
  middleName: '',
  lastName: '',
  secondLastName: '',
  identificationType: '',
  documentId: '',
  taxId: '',
  email: '',
  phone: '',
  address: {
    country: 'VE',
    state: '',
    city: '',
    addressLine: '',
    reference: '',
  },
};

export function ClientListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState('');
  const { data: clients, isLoading, refetch, isFetching } = useClients(search || undefined);
  const createClient = useCreateClient();

  const form = useForm({
    defaultValues,
    validators: { onSubmit: clientFormSchema },
    onSubmit: async ({ value }) => {
      setServerError('');
      try {
        await createClient.mutateAsync({
          documentId: value.documentId.trim(),
          identificationType: value.identificationType || undefined,
          legalName: value.legalName.trim(),
          firstName: value.firstName.trim() || undefined,
          middleName: value.middleName.trim() || undefined,
          lastName: value.lastName.trim() || undefined,
          secondLastName: value.secondLastName.trim() || undefined,
          taxId: value.taxId.trim() || value.documentId.trim(),
          email: value.email.trim() || undefined,
          phone: value.phone || undefined,
          addressId: undefined,
        });
        form.reset();
        setShowForm(false);
      } catch (error) {
        const result = applyServerErrors(form, error);
        setServerError(resolveServerErrorMessage(result, t('common.saveUnconfirmed')));
      }
    },
  });

  const openForm = () => {
    clearServerErrors(form);
    setServerError('');
    setShowForm(true);
  };

  const rows: ClientRow[] = (clients ?? []).map((c: any) => ({
    id: c.id,
    legalName: c.legalName,
    documentId: c.documentId,
    email: c.email ?? '',
    phone: c.phone ?? '',
  }));

  const pagination = usePagination(rows, { resetKey: search });

  const columns: GridColumn<ClientRow>[] = [
    { key: 'legalName', label: t('clients.legalName'), sortable: true },
    { key: 'documentId', label: t('clients.documentId'), width: 160 },
    { key: 'email', label: 'Email', width: 200 },
    { key: 'phone', label: 'Phone', width: 140 },
  ];

  const clientFields = (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <FormInput
          form={form}
          name="legalName"
          label="Razón Social / Nombre Completo"
          required
          className="col-span-2"
        />
        <FormInput form={form} name="firstName" label="Primer Nombre" />
        <FormInput form={form} name="middleName" label="Otros Nombres" />
        <FormInput form={form} name="lastName" label="Primer Apellido" />
        <FormInput form={form} name="secondLastName" label="Segundo Apellido" />
        <FormDocumentInput
          form={form}
          name="documentId"
          identificationTypeName="identificationType"
          label={t('clients.documentId')}
          className="col-span-2"
          required
        />
        <FormInput form={form} name="taxId" label="RIF / NIT" />
        <FormInput form={form} name="email" label="Email" type="email" />
        <FormPhoneInput form={form} name="phone" label="Teléfono" defaultCountry="VE" />
        <FormAddressInput
          form={form}
          name="address"
          label="Dirección"
          className="col-span-2"
        />
      </div>
    </div>
  );

  const clientActions = (
    <div className="flex justify-end gap-3">
      <button
        onClick={() => setShowForm(false)}
        className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
      >
        {t('common.cancel')}
      </button>
      <button
        onClick={() => void form.handleSubmit()}
        disabled={createClient.isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {t('common.save')}
      </button>
    </div>
  );

  return (
    <>
      <ListPage
        title={t('clients.title')}
        subtitle={t('clients.subtitle')}
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
          <>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              aria-label={t('common.search')}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <button
              onClick={openForm}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              + {t('common.create')}
            </button>
          </>
        }
      >
        <VirtualGrid
          data={pagination.pageItems}
          columns={columns}
          loading={isLoading}
          emptyMessage={t('common.noResults')}
          onRowClick={(row) => navigate(`/clients/${row.id}`)}
        />
      </ListPage>
      <Drawer.Root isOpen={showForm} onOpenChange={setShowForm}>
        <Drawer.Backdrop isDismissable>
          <Drawer.Content placement="right">
            <Drawer.Dialog className="flex h-full w-full flex-col bg-overlay p-0 sm:w-[480px]">
              <Drawer.Header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                <Drawer.Heading className="font-brand text-base font-extrabold text-text-primary">
                  {t('clients.create')}
                </Drawer.Heading>
                <Drawer.CloseTrigger
                  aria-label={t('common.close')}
                  className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                >
                  ✕
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {clientFields}
                {serverError && (
                  <p role="alert" className="mt-2 text-xs text-red-500">
                    {serverError}
                  </p>
                )}
              </Drawer.Body>
              <Drawer.Footer className="shrink-0 border-t border-border px-6 py-4">
                {clientActions}
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer.Root>
    </>
  );
}

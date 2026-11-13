import { useDeferredValue, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useStore } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useVendors } from '@/shared/hooks/useVendors';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateVendor } from '@/modules/client-vendor/hooks/useCreateVendor';
import { Drawer } from '@heroui/react';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import {
  applyServerErrors,
  clearServerErrors,
  FormAddressInput,
  FormDocumentInput,
  FormInput,
  FormMultiSelect,
  FormPhoneInput,
  FormSelect,
} from '@/shared/form';
import {
  VENDOR_EMAIL_ERROR_MESSAGE,
  vendorFormSchema,
  type VendorFormValues,
} from '@/shared/validation/vendor';

interface VendorRow {
  id: string;
  legalName: string;
  documentId: string;
  email: string;
  phone: string;
}

const defaultValues: VendorFormValues = {
  legalName: '',
  documentId: '',
  identificationType: '',
  ownerIdentificationType: '',
  ownerIdentificationNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  secondLastName: '',
  email: '',
  phone: '',
  address: {
    country: 'VE',
    state: '',
    city: '',
    addressLine: '',
    reference: '',
  },
  commercialName: '',
  website: '',
  notes: '',
  paymentTerms: '',
  categoryIds: [],
  deliveryDays: undefined,
};

const CONTACT_ROLES = ['Ventas', 'Administración', 'Logística', 'Otro'] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_ERROR_MESSAGE = VENDOR_EMAIL_ERROR_MESSAGE;

interface ContactForm {
  key: string;
  role: string;
  fullName: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

const newContact = (role = 'Ventas', isPrimary = false): ContactForm => ({
  key:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  role,
  fullName: '',
  email: '',
  phone: '',
  isPrimary,
});

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none placeholder:text-text-secondary';

const sectionHeaderClass = 'mb-4 border-b border-border pb-2';
const sectionTitleClass = 'text-sm font-semibold text-text-primary';
const sectionHintClass = 'mt-0.5 text-xs text-text-secondary';

export function VendorListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [showForm, setShowForm] = useState(false);
  const { data: vendors, isLoading, refetch, isFetching } = useVendors(deferredSearch || undefined);
  const { data: categories } = useCategories();
  const createVendor = useCreateVendor();

  const [serverError, setServerError] = useState('');
  const [contacts, setContacts] = useState<ContactForm[]>([]);
  const [ownerIsPrimaryContact, setOwnerIsPrimaryContact] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const form = useForm({
    defaultValues,
    validators: { onSubmit: vendorFormSchema },
    onSubmitInvalid: () => setSubmitAttempted(true),
    onSubmit: async ({ value }) => {
      setSubmitAttempted(true);
      setServerError('');
      if (contactEmailInvalid.size > 0) return;

      try {
        await createVendor.mutateAsync({
          documentId: value.documentId.trim(),
          identificationType: value.identificationType || undefined,
          legalName: value.legalName.trim(),
          firstName: value.firstName.trim() || undefined,
          middleName: value.middleName.trim() || undefined,
          lastName: value.lastName.trim() || undefined,
          secondLastName: value.secondLastName.trim() || undefined,
          taxId: value.documentId.trim(),
          email: value.email.trim() || undefined,
          phone: value.phone || undefined,
          contactIdentificationType: value.ownerIdentificationType || undefined,
          contactIdentificationNumber: value.ownerIdentificationNumber.trim() || undefined,
          address: value.address.addressLine.trim()
            ? {
                country: value.address.country,
                state: value.address.state,
                city: value.address.city,
                addressLine: value.address.addressLine.trim(),
                reference: value.address.reference.trim() || undefined,
              }
            : undefined,
          ownerIsPrimary: ownerIsEffectivePrimary || undefined,
          commercialName: value.commercialName.trim() || undefined,
          website: value.website.trim() || undefined,
          metadataNotes: value.notes.trim() || undefined,
          paymentTerms: value.paymentTerms || undefined,
          deliveryDays: value.deliveryDays,
          categoryIds: value.categoryIds.length ? value.categoryIds : undefined,
          contacts: contacts
            .filter((contact) => contact.fullName.trim())
            .map((contact) => ({
              fullName: contact.fullName.trim(),
              position: contact.role || undefined,
              email: contact.email.trim() || undefined,
              phone: contact.phone || undefined,
              isPrimary: ownerIsEffectivePrimary ? false : contact.isPrimary,
            })),
        });
        form.reset();
        setContacts([]);
        setOwnerIsPrimaryContact(false);
        setSubmitAttempted(false);
        setShowForm(false);
      } catch (error) {
        const { applied, unmapped } = applyServerErrors(form, error);
        const translated = unmapped
          .join(' ')
          .replace(/email must be an email/g, 'El correo no es válido');
        setServerError(translated || (applied.length > 0 ? '' : t('common.saveUnconfirmed')));
      }
    },
  });

  const hasOwnerData = useStore(form.store, (state) =>
    Boolean(
      state.values.firstName.trim() ||
        state.values.middleName.trim() ||
        state.values.lastName.trim() ||
        state.values.secondLastName.trim() ||
        state.values.email.trim() ||
        state.values.phone ||
        state.values.ownerIdentificationNumber.trim(),
    ),
  );
  const contactEmailInvalid = new Map(
    contacts
      .filter(
        (contact) =>
          contact.fullName.trim() &&
          contact.email.trim() !== '' &&
          !EMAIL_PATTERN.test(contact.email.trim()),
      )
      .map((contact) => [contact.key, EMAIL_ERROR_MESSAGE]),
  );
  const ownerIsEffectivePrimary = hasOwnerData && (ownerIsPrimaryContact || contacts.length === 0);

  const setOwnerPrimary = (checked: boolean) => {
    setOwnerIsPrimaryContact(checked);
    setContacts((prev) => {
      if (checked) return prev.map((c) => ({ ...c, isPrimary: false }));
      if (prev.length && !prev.some((c) => c.isPrimary)) {
        return prev.map((c, index) => ({ ...c, isPrimary: index === 0 }));
      }
      return prev;
    });
  };

  const updateContact = (key: string, patch: Partial<ContactForm>) => {
    setContacts((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const addContact = () =>
    setContacts((prev) => {
      const isPrimary = !ownerIsPrimaryContact && !prev.some((c) => c.isPrimary);
      return [...prev, newContact('Ventas', isPrimary)];
    });

  const removeContact = (key: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.key !== key);
      if (next.length && !ownerIsPrimaryContact && !next.some((c) => c.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const setPrimaryContact = (key: string) => {
    setOwnerIsPrimaryContact(false);
    setContacts((prev) => prev.map((c) => ({ ...c, isPrimary: c.key === key })));
  };

  const rows: VendorRow[] = (vendors ?? []).map((v: any) => ({
    id: v.id,
    legalName: v.legalName,
    documentId: v.documentId,
    email: v.email ?? '',
    phone: v.phone ?? '',
  }));

  const pagination = usePagination(rows, { resetKey: search });

  const columns: GridColumn<VendorRow>[] = [
    { key: 'legalName', label: t('vendors.legalName'), sortable: true },
    { key: 'documentId', label: t('vendors.documentId'), width: 160 },
    { key: 'email', label: 'Email', width: 200 },
    { key: 'phone', label: 'Phone', width: 140 },
  ];

  const vendorFields = (
    <div className="space-y-8">
      <section aria-labelledby="vendor-company-heading">
        <div className={sectionHeaderClass}>
          <h3 id="vendor-company-heading" className={sectionTitleClass}>
            Datos de la empresa
          </h3>
          <p className={sectionHintClass}>Identidad fiscal y ubicación del proveedor.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            form={form}
            name="legalName"
            label="Razón Social"
            required
            className="sm:col-span-2"
          />
          <FormDocumentInput
            form={form}
            name="documentId"
            identificationTypeName="identificationType"
            label="RIF / NIT"
            allowedGroups={['RIF']}
            className="sm:col-span-2"
            required
          />
          <FormAddressInput
            form={form}
            name="address"
            label="Dirección fiscal"
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section aria-labelledby="vendor-owner-heading">
        <div className={sectionHeaderClass}>
          <h3 id="vendor-owner-heading" className={sectionTitleClass}>
            Datos del dueño
          </h3>
          <p className={sectionHintClass}>
            Se guarda como un contacto con rol Dueño, aunque el responsable diario sea un empleado.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput form={form} name="firstName" label="Primer Nombre" />
          <FormInput form={form} name="middleName" label="Otros Nombres" />
          <FormInput form={form} name="lastName" label="Primer Apellido" />
          <FormInput form={form} name="secondLastName" label="Segundo Apellido" />
          <FormDocumentInput
            form={form}
            name="ownerIdentificationNumber"
            identificationTypeName="ownerIdentificationType"
            label="Cédula / Pasaporte"
            allowedGroups={['CI', 'PAS', 'CE', 'TI']}
            className="sm:col-span-2"
          />
          <div>
            <FormInput form={form} name="email" label="Email del dueño" type="email" />
            <p className="mt-1 text-[11px] text-text-secondary">
              Opcional. Ej. ventas@proveedor.com
            </p>
          </div>
          <FormPhoneInput
            form={form}
            name="phone"
            label="Teléfono del dueño"
            defaultCountry="VE"
          />
          <label className="flex items-start gap-2 border-t border-border pt-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={ownerIsEffectivePrimary}
              disabled={!hasOwnerData || contacts.length === 0}
              onChange={(e) => setOwnerPrimary(e.target.checked)}
              className="mt-0.5 disabled:opacity-50"
            />
            <span>
              <span className="block text-xs font-medium text-text-primary">
                ¿El dueño es el contacto principal?
              </span>
              <span className="mt-0.5 block text-[11px] text-text-secondary">
                {!hasOwnerData
                  ? 'Completa los datos del dueño para marcarlo como principal.'
                  : contacts.length === 0
                    ? 'Es el único contacto del proveedor, por eso queda como principal.'
                    : ownerIsEffectivePrimary
                      ? 'Desmárcalo si el contacto principal es un responsable de la lista.'
                      : 'El responsable marcado abajo será el contacto principal.'}
              </span>
            </span>
          </label>
        </div>
      </section>

      <section aria-labelledby="vendor-commercial-heading">
        <div className={sectionHeaderClass}>
          <h3 id="vendor-commercial-heading" className={sectionTitleClass}>
            Configuración Comercial
          </h3>
          <p className={sectionHintClass}>Condiciones de compra y datos de catálogo.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            form={form}
            name="paymentTerms"
            label="Términos de Pago"
            placeholder="Seleccionar..."
            options={[
              { value: 'contado', label: 'Contado' },
              { value: 'credito-7', label: 'Crédito 7 días' },
              { value: 'credito-15', label: 'Crédito 15 días' },
              { value: 'credito-30', label: 'Crédito 30 días' },
            ]}
          />
          <FormInput
            form={form}
            name="deliveryDays"
            label="Días para entrega"
            type="number"
            min={0}
            placeholder="Ej. 5"
          />
          <div className="sm:col-span-2">
            <FormMultiSelect
              form={form}
              name="categoryIds"
              label="Categorías de producto"
              options={(categories ?? []).map((c: any) => ({ id: c.id, label: c.name }))}
              placeholder="Seleccionar categorías..."
              searchPlaceholder="Buscar categorías..."
              emptyMessage="No hay categorías"
            />
            <p className="mt-1 text-[11px] text-text-secondary">
              Un proveedor puede abastecer varias categorías.
            </p>
          </div>
          <FormInput form={form} name="commercialName" label="Nombre comercial" />
          <FormInput
            form={form}
            name="website"
            label="Sitio web"
            type="url"
            placeholder="https://"
          />
          <FormInput form={form} name="notes" label="Notas" multiline rows={2} className="sm:col-span-2" />
        </div>
      </section>

      <section aria-labelledby="vendor-contacts-heading">
        <div className={`${sectionHeaderClass} flex flex-wrap items-end justify-between gap-3`}>
          <div>
            <h3 id="vendor-contacts-heading" className={sectionTitleClass}>
              Contactos del proveedor
            </h3>
            <p className={sectionHintClass}>
              Responsables diarios de ventas, administración o logística.
            </p>
          </div>
          <button
            type="button"
            onClick={addContact}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            + Agregar contacto
          </button>
        </div>
        {ownerIsEffectivePrimary && contacts.length > 0 && (
          <p className="mb-3 text-[11px] text-text-secondary">
            El dueño es el contacto principal. Desmárcalo en «Datos del dueño» para elegir un
            responsable.
          </p>
        )}
        {contacts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-text-secondary">
            Aún no hay contactos. Agrega al menos uno para saber con quién coordinar los pedidos.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {contacts.map((contact) => {
              const contactEmailError = submitAttempted
                ? contactEmailInvalid.get(contact.key)
                : undefined;
              return (
                <li key={contact.key} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                  <Field label="Rol / Puesto" htmlFor={`contact-role-${contact.key}`}>
                    <select
                      id={`contact-role-${contact.key}`}
                      value={contact.role}
                      onChange={(e) => updateContact(contact.key, { role: e.target.value })}
                      className={inputClass}
                    >
                      {CONTACT_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Nombre completo" htmlFor={`contact-name-${contact.key}`}>
                    <input
                      id={`contact-name-${contact.key}`}
                      type="text"
                      value={contact.fullName}
                      onChange={(e) => updateContact(contact.key, { fullName: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label="Email"
                    htmlFor={`contact-email-${contact.key}`}
                    error={contactEmailError}
                  >
                    <input
                      id={`contact-email-${contact.key}`}
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(contact.key, { email: e.target.value })}
                      aria-invalid={Boolean(contactEmailError)}
                      aria-describedby={
                        contactEmailError ? `contact-email-${contact.key}-error` : undefined
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Teléfono" htmlFor={`contact-phone-${contact.key}`}>
                    <input
                      id={`contact-phone-${contact.key}`}
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact(contact.key, { phone: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <div className="flex items-center justify-between sm:col-span-2">
                    <label
                      className={
                        ownerIsEffectivePrimary
                          ? 'flex cursor-not-allowed items-center gap-2 text-xs text-text-secondary/60'
                          : 'flex items-center gap-2 text-xs text-text-secondary'
                      }
                    >
                      <input
                        type="radio"
                        name="primary-contact"
                        checked={!ownerIsEffectivePrimary && contact.isPrimary}
                        disabled={ownerIsEffectivePrimary}
                        onChange={() => setPrimaryContact(contact.key)}
                      />
                      Contacto principal
                    </label>
                    <button
                      type="button"
                      onClick={() => removeContact(contact.key)}
                      className="text-xs text-text-secondary hover:text-error"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {serverError && (
        <p role="alert" className="text-sm text-error">
          {serverError}
        </p>
      )}
    </div>
  );

  const vendorActions = (
    <div className="flex justify-end gap-3">
      <button
        onClick={() => setShowForm(false)}
        className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
      >
        {t('common.cancel')}
      </button>
      <button
        onClick={() => void form.handleSubmit()}
        disabled={createVendor.isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {t('common.save')}
      </button>
    </div>
  );

  return (
    <>
      <ListPage
        title={t('vendors.title')}
        subtitle={t('vendors.subtitle')}
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
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none sm:w-56"
            />
            {!isLoading && (
              <span className="text-xs text-text-secondary">
                {t('vendors.count').replace('{count}', String(vendors?.length ?? 0))}
              </span>
            )}
            <button
              onClick={() => {
                clearServerErrors(form);
                setServerError('');
                setShowForm(true);
              }}
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
          onRowClick={(row) => navigate(`/vendors/${row.id}`)}
        />
      </ListPage>
      <Drawer.Root isOpen={showForm} onOpenChange={setShowForm}>
        <Drawer.Backdrop isDismissable>
          <Drawer.Content placement="right">
            <Drawer.Dialog className="flex h-full w-full max-w-full flex-col bg-overlay p-0 sm:w-[560px]">
              <Drawer.Header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                <Drawer.Heading className="font-brand text-base font-extrabold text-text-primary">
                  {t('vendors.create')}
                </Drawer.Heading>
                <Drawer.CloseTrigger
                  aria-label={t('common.close')}
                  className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                >
                  ✕
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {vendorFields}
              </Drawer.Body>
              <Drawer.Footer className="shrink-0 border-t border-border px-6 py-4">
                {vendorActions}
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer.Root>
    </>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className = '',
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-text-secondary">
        {label}
        {required && (
          <span className="ml-0.5 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-[11px] text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}

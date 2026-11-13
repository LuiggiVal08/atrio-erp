import { useState, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useVendors } from '@/shared/hooks/useVendors';
import { useCategories } from '@/shared/hooks/useCategories';
import { useCreateVendor } from '@/modules/client-vendor/hooks/useCreateVendor';
import { Drawer } from '@heroui/react';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { ListPage } from '@/core/components/ListPage';
import { ListPagination } from '@/core/components/ListPagination';
import { usePagination } from '@/shared/hooks/usePagination';
import { DocumentInput } from '@/shared/ui/DocumentInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { AddressInput, type AddressValues } from '@/shared/ui/AddressInput';
import { MultiSelect } from '@/shared/ui/MultiSelect';

interface VendorRow {
  id: string;
  legalName: string;
  documentId: string;
  email: string;
  phone: string;
}

const emptyAddress: AddressValues = {
  country: 'VE',
  state: '',
  city: '',
  addressLine: '',
  reference: '',
};

const CONTACT_ROLES = ['Ventas', 'Administración', 'Logística', 'Otro'] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_ERROR_MESSAGE = 'Ingresa un correo válido (ej. ventas@proveedor.com).';

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
  const [showForm, setShowForm] = useState(false);
  const { data: vendors, isLoading, refetch, isFetching } = useVendors(search || undefined);
  const { data: categories } = useCategories();
  const createVendor = useCreateVendor();

  const [legalName, setLegalName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [secondLastName, setSecondLastName] = useState('');
  const [identificationType, setIdentificationType] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [ownerIdentificationType, setOwnerIdentificationType] = useState('');
  const [ownerIdentificationNumber, setOwnerIdentificationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<AddressValues>(emptyAddress);
  const [commercialName, setCommercialName] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [deliveryDays, setDeliveryDays] = useState('');

  const [contacts, setContacts] = useState<ContactForm[]>([]);
  const [ownerIsPrimaryContact, setOwnerIsPrimaryContact] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const ownerEmailInvalid = email.trim() !== '' && !EMAIL_PATTERN.test(email.trim());
  const contactEmailInvalid = new Map(
    contacts
      .filter(
        (c) => c.fullName.trim() && c.email.trim() !== '' && !EMAIL_PATTERN.test(c.email.trim()),
      )
      .map((c) => [c.key, EMAIL_ERROR_MESSAGE]),
  );
  const hasEmailErrors = ownerEmailInvalid || contactEmailInvalid.size > 0;
  const ownerEmailError = submitAttempted && ownerEmailInvalid ? EMAIL_ERROR_MESSAGE : undefined;

  const hasOwnerData = Boolean(
    firstName.trim() ||
    middleName.trim() ||
    lastName.trim() ||
    secondLastName.trim() ||
    email.trim() ||
    phone ||
    ownerIdentificationNumber.trim(),
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

  const serverMessage = isAxiosError(createVendor.error)
    ? createVendor.error.response?.data?.message
    : undefined;
  const rawErrorMessage = Array.isArray(serverMessage)
    ? serverMessage.join(' ')
    : typeof serverMessage === 'string'
      ? serverMessage
      : t('common.saveUnconfirmed');
  const errorMessage = rawErrorMessage.replace(/email must be an email/g, 'El correo no es válido');

  const handleCreate = () => {
    if (!legalName.trim() || !documentId.trim() || createVendor.isPending) return;
    setSubmitAttempted(true);
    if (hasEmailErrors) return;
    createVendor.mutate(
      {
        documentId: documentId.trim(),
        identificationType: identificationType || undefined,
        legalName: legalName.trim(),
        firstName: firstName.trim() || undefined,
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        secondLastName: secondLastName.trim() || undefined,
        taxId: documentId.trim(),
        email: email.trim() || undefined,
        phone: phone || undefined,
        contactIdentificationType: ownerIdentificationType || undefined,
        contactIdentificationNumber: ownerIdentificationNumber.trim() || undefined,
        address: address.addressLine.trim()
          ? {
              country: address.country,
              state: address.state,
              city: address.city,
              addressLine: address.addressLine.trim(),
              reference: address.reference?.trim() || undefined,
            }
          : undefined,
        ownerIsPrimary: ownerIsEffectivePrimary || undefined,
        commercialName: commercialName.trim() || undefined,
        website: website.trim() || undefined,
        metadataNotes: notes.trim() || undefined,
        paymentTerms: paymentTerms || undefined,
        deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
        categoryIds: categoryIds.length ? categoryIds : undefined,
        contacts: contacts
          .filter((c) => c.fullName.trim())
          .map((c) => ({
            fullName: c.fullName.trim(),
            position: c.role || undefined,
            email: c.email.trim() || undefined,
            phone: c.phone || undefined,
            isPrimary: ownerIsEffectivePrimary ? false : c.isPrimary,
          })),
      },
      {
        onSuccess: () => {
          setLegalName('');
          setFirstName('');
          setMiddleName('');
          setLastName('');
          setSecondLastName('');
          setIdentificationType('');
          setDocumentId('');
          setOwnerIdentificationType('');
          setOwnerIdentificationNumber('');
          setEmail('');
          setPhone('');
          setAddress(emptyAddress);
          setCommercialName('');
          setWebsite('');
          setNotes('');
          setPaymentTerms('');
          setCategoryIds([]);
          setDeliveryDays('');
          setContacts([]);
          setOwnerIsPrimaryContact(false);
          setSubmitAttempted(false);
          setShowForm(false);
        },
      },
    );
  };

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
          <Field
            label="Razón Social"
            htmlFor="vendor-legal-name"
            required
            className="sm:col-span-2"
          >
            <input
              id="vendor-legal-name"
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              aria-required="true"
              className={inputClass}
            />
          </Field>
          <DocumentInput
            value={documentId}
            onChange={setDocumentId}
            identificationType={identificationType}
            onIdentificationTypeChange={setIdentificationType}
            label="RIF / NIT"
            allowedGroups={['RIF']}
            className="sm:col-span-2"
          />
          <AddressInput
            value={address}
            onChange={setAddress}
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
          <Field label="Primer Nombre" htmlFor="vendor-owner-first-name">
            <input
              id="vendor-owner-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Otros Nombres" htmlFor="vendor-owner-middle-name">
            <input
              id="vendor-owner-middle-name"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Primer Apellido" htmlFor="vendor-owner-last-name">
            <input
              id="vendor-owner-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Segundo Apellido" htmlFor="vendor-owner-second-last-name">
            <input
              id="vendor-owner-second-last-name"
              type="text"
              value={secondLastName}
              onChange={(e) => setSecondLastName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <DocumentInput
            value={ownerIdentificationNumber}
            onChange={setOwnerIdentificationNumber}
            identificationType={ownerIdentificationType}
            onIdentificationTypeChange={setOwnerIdentificationType}
            label="Cédula / Pasaporte"
            allowedGroups={['CI', 'PAS', 'CE', 'TI']}
            className="sm:col-span-2"
          />
          <Field
            label="Email del dueño"
            htmlFor="vendor-owner-email"
            error={ownerEmailError}
            hint="Opcional. Ej. ventas@proveedor.com"
          >
            <input
              id="vendor-owner-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(ownerEmailError)}
              aria-describedby={ownerEmailError ? 'vendor-owner-email-error' : undefined}
              className={inputClass}
            />
          </Field>
          <PhoneInput
            value={phone}
            onChange={setPhone}
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
          <Field label="Términos de Pago" htmlFor="vendor-payment-terms">
            <select
              id="vendor-payment-terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccionar...</option>
              <option value="contado">Contado</option>
              <option value="credito-7">Crédito 7 días</option>
              <option value="credito-15">Crédito 15 días</option>
              <option value="credito-30">Crédito 30 días</option>
            </select>
          </Field>
          <Field label="Días para entrega" htmlFor="vendor-delivery-days">
            <input
              id="vendor-delivery-days"
              type="number"
              min={0}
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              className={inputClass}
              placeholder="Ej. 5"
            />
          </Field>
          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-text-secondary">
              Categorías de producto
            </span>
            <MultiSelect
              options={(categories ?? []).map((c: any) => ({ id: c.id, label: c.name }))}
              value={categoryIds}
              onChange={setCategoryIds}
              ariaLabel="Categorías de producto"
              placeholder="Seleccionar categorías..."
              searchPlaceholder="Buscar categorías..."
              emptyMessage="No hay categorías"
            />
            <p className="mt-1 text-[11px] text-text-secondary">
              Un proveedor puede abastecer varias categorías.
            </p>
          </div>
          <Field label="Nombre comercial" htmlFor="vendor-commercial-name">
            <input
              id="vendor-commercial-name"
              type="text"
              value={commercialName}
              onChange={(e) => setCommercialName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Sitio web" htmlFor="vendor-website">
            <input
              id="vendor-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={inputClass}
              placeholder="https://"
            />
          </Field>
          <Field label="Notas" htmlFor="vendor-notes" className="sm:col-span-2">
            <textarea
              id="vendor-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </Field>
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

      {createVendor.isError && (
        <p role="alert" className="text-sm text-error">
          {errorMessage}
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
        onClick={handleCreate}
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
              onClick={() => setShowForm(true)}
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

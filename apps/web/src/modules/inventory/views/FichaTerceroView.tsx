import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCategories } from '@/shared/hooks/useCategories';
import { useUpdateVendor } from '@/modules/client-vendor/hooks/useUpdateVendor';
import { toastService } from '@/core/services/toast-service';
import { MultiSelect } from '@/shared/ui/MultiSelect';
import { DocumentInput } from '@/shared/ui/DocumentInput';
import { useFichaTercero, type ThirdPartyKind } from '../hooks/useFichaTercero';
import { ModuleSkeleton } from '@/core/components/ModuleSkeleton';
import { ReadErrorAlert } from '@/core/components/ReadErrorAlert';

interface FichaTerceroViewProps {
  id: string;
  kind: ThirdPartyKind;
}

interface VendorFormState {
  legalName: string;
  documentId: string;
  identificationType: string;
  taxId: string;
  email: string;
  phone: string;
  commercialName: string;
  website: string;
  paymentTerms: string;
  deliveryDays: string;
  metadataNotes: string;
  addressLine: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
  addressReference: string;
}

interface ContactDraft {
  key: string;
  id?: string;
  fullName: string;
  position: string;
  email: string;
  phone: string;
  mobile: string;
  identificationNumber: string;
  isPrimary: boolean;
}

const emptyForm: VendorFormState = {
  legalName: '',
  documentId: '',
  identificationType: '',
  taxId: '',
  email: '',
  phone: '',
  commercialName: '',
  website: '',
  paymentTerms: '',
  deliveryDays: '',
  metadataNotes: '',
  addressLine: '',
  addressCity: '',
  addressState: '',
  addressCountry: 'VE',
  addressReference: '',
};

const labelClass = 'text-xs text-text-secondary';
const valueClass = 'font-medium text-text-primary';
const inputClass = 'mt-0.5 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none';

const newContactKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const isOwnerContact = (contact: ContactDraft) => contact.position === 'Dueño';

export function FichaTerceroView({ id, kind }: FichaTerceroViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: ficha, isLoading, isError, error, refetch, isFetching } = useFichaTercero(id, kind);
  const { data: categories } = useCategories();
  const updateVendor = useUpdateVendor();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<VendorFormState>(emptyForm);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [contactDrafts, setContactDrafts] = useState<ContactDraft[]>([]);

  const goBack = () => navigate(kind === 'vendor' ? '/vendors' : '/clients');

  if (isLoading) {
    return <ModuleSkeleton moduleName={t('crm.ficha.overview')} />;
  }
  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <ReadErrorAlert error={error} onRetry={() => void refetch()} retrying={isFetching} />
        <button type="button" onClick={goBack} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:text-text-primary">
          {t('crm.ficha.back')}
        </button>
      </div>
    );
  }
  if (!ficha) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-secondary">
        <p>{t('common.notFound')}</p>
        <button type="button" onClick={goBack} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:text-text-primary">
          {t('crm.ficha.back')}
        </button>
      </div>
    );
  }

  const isVendor = ficha.kind === 'vendor';
  const contacts = ficha.contacts ?? [];
  const fichaCategories = ficha.categories ?? [];
  const active = ficha.isActive !== false;

  const startEdit = () => {
    setForm({
      legalName: ficha.legalName ?? '',
      documentId: ficha.documentId ?? '',
      identificationType: ficha.identificationType ?? '',
      taxId: ficha.taxId ?? '',
      email: ficha.email ?? '',
      phone: ficha.phone ?? '',
      commercialName: ficha.commercialName ?? '',
      website: ficha.website ?? '',
      paymentTerms: ficha.paymentTerms ?? '',
      deliveryDays: ficha.deliveryDays != null ? String(ficha.deliveryDays) : '',
      metadataNotes: ficha.metadataNotes ?? '',
      addressLine: ficha.address?.line1 ?? '',
      addressCity: ficha.address?.city ?? '',
      addressState: ficha.address?.state ?? '',
      addressCountry: ficha.address?.country ?? 'VE',
      addressReference: ficha.address?.line2 ?? '',
    });
    setCategoryIds(fichaCategories.map((category) => category.id));
    setContactDrafts(
      contacts.map((contact) => ({
        key: contact.id,
        id: contact.id,
        fullName: contact.fullName,
        position: contact.position ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        mobile: contact.mobile ?? '',
        identificationNumber: contact.identificationNumber ?? '',
        isPrimary: contact.isPrimary,
      })),
    );
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const addContact = () => {
    setContactDrafts((prev) => [
      ...prev,
      {
        key: newContactKey(),
        fullName: '',
        position: 'Ventas',
        email: '',
        phone: '',
        mobile: '',
        identificationNumber: '',
        isPrimary: !prev.some((contact) => contact.isPrimary),
      },
    ]);
  };

  const updateContact = (key: string, patch: Partial<ContactDraft>) => {
    setContactDrafts((prev) => prev.map((contact) => (contact.key === key ? { ...contact, ...patch } : contact)));
  };

  const removeContact = (key: string) => {
    setContactDrafts((prev) => {
      const removed = prev.find((contact) => contact.key === key);
      if (removed && isOwnerContact(removed)) return prev;
      const next = prev.filter((contact) => contact.key !== key);
      if (removed?.isPrimary && next.length) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const setPrimaryContact = (key: string) => {
    setContactDrafts((prev) => prev.map((contact) => ({ ...contact, isPrimary: contact.key === key })));
  };

  const save = async () => {
    if (!form.legalName.trim()) {
      toastService.error(t('crm.ficha.legalNameRequired'));
      return;
    }
    const addressLine = form.addressLine.trim();
    if (addressLine && (!form.addressCity.trim() || !form.addressState.trim() || !form.addressCountry.trim())) {
      toastService.error(t('crm.ficha.addressIncomplete'));
      return;
    }
    const validContacts = contactDrafts.filter((contact) => contact.fullName.trim());
    try {
      await updateVendor.mutateAsync({
        id: ficha.id,
        legalName: form.legalName.trim(),
        documentId: form.documentId.trim() || undefined,
        identificationType: form.identificationType || undefined,
        taxId: form.taxId.trim() || form.documentId.trim() || undefined,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        commercialName: form.commercialName.trim() || undefined,
        website: form.website.trim() || undefined,
        metadataNotes: form.metadataNotes.trim() || undefined,
        paymentTerms: form.paymentTerms || undefined,
        deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : undefined,
        categoryIds,
        address: addressLine ? {
          country: form.addressCountry.trim(),
          state: form.addressState.trim(),
          city: form.addressCity.trim(),
          addressLine,
          reference: form.addressReference.trim() || undefined,
        } : null,
        contacts: validContacts.map((contact) => ({
          id: contact.id,
          fullName: contact.fullName.trim(),
          position: contact.position || undefined,
          email: contact.email.trim() || null,
          phone: contact.phone.trim() || null,
          mobile: contact.mobile.trim() || null,
          identificationNumber: contact.identificationNumber.trim() || null,
          isPrimary: contact.isPrimary,
        })),
      });
      toastService.success(t('crm.ficha.saveSuccess'));
      setEditing(false);
    } catch {
      toastService.error(t('crm.ficha.saveError'), t('common.saveUnconfirmed'));
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={goBack} className="rounded-lg border border-border px-2 py-1 text-xs text-text-secondary hover:text-text-primary">
            ← {t('crm.ficha.back')}
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary">{ficha.legalName}</h1>
            <p className="mt-1 text-xs text-text-secondary">
              {t(isVendor ? 'crm.ficha.vendor' : 'crm.ficha.customer')}
              {ficha.taxId ? ` · ${ficha.taxId}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-success/10 text-success' : 'bg-surface-hover text-text-secondary'}`}>
            {t(active ? 'crm.ficha.active' : 'crm.ficha.inactive')}
          </span>
          {isVendor && (editing ? (
            <>
              <button type="button" onClick={cancelEdit} className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary">
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={updateVendor.isPending}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </>
          ) : (
            <button type="button" onClick={startEdit} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover">
              {t('common.edit')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-auto p-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-bold text-text-primary">{t('crm.ficha.overview')}</h2>
          {editing ? (
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <FieldInput label={t('crm.ficha.legalName')} value={form.legalName} onChange={(value) => setForm({ ...form, legalName: value })} required />
              <DocumentInput
                value={form.documentId}
                onChange={(value) => setForm({ ...form, documentId: value, taxId: value })}
                identificationType={form.identificationType}
                onIdentificationTypeChange={(value) => setForm({ ...form, identificationType: value })}
                label={t('crm.ficha.documentId')}
                allowedGroups={['RIF']}
              />
              <FieldInput label={t('crm.ficha.taxId')} value={form.taxId} onChange={(value) => setForm({ ...form, taxId: value })} />
              <FieldInput label={t('crm.ficha.email')} value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" />
              <FieldInput label={t('crm.ficha.phone')} value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
              <FieldInput label={t('crm.ficha.commercialName')} value={form.commercialName} onChange={(value) => setForm({ ...form, commercialName: value })} />
              <FieldInput label={t('crm.ficha.website')} value={form.website} onChange={(value) => setForm({ ...form, website: value })} type="url" />
              <div>
                <label className={labelClass} htmlFor="vendor-payment-terms">{t('crm.ficha.paymentTerms')}</label>
                <select
                  id="vendor-payment-terms"
                  value={form.paymentTerms}
                  onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })}
                  className={inputClass}
                >
                  <option value="">—</option>
                  <option value="contado">Contado</option>
                  <option value="credito-7">Crédito 7 días</option>
                  <option value="credito-15">Crédito 15 días</option>
                  <option value="credito-30">Crédito 30 días</option>
                </select>
              </div>
              <FieldInput label={t('crm.ficha.deliveryDays')} value={form.deliveryDays} onChange={(value) => setForm({ ...form, deliveryDays: value })} type="number" />
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="vendor-notes">{t('crm.ficha.notes')}</label>
                <textarea
                  id="vendor-notes"
                  rows={2}
                  value={form.metadataNotes}
                  onChange={(event) => setForm({ ...form, metadataNotes: event.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <Field label={t('crm.ficha.documentId')} value={ficha.documentId} />
                <Field label={t('crm.ficha.taxId')} value={ficha.taxId} />
                <Field label={t('crm.ficha.phone')} value={ficha.phone} />
                <Field label={t('crm.ficha.email')} value={ficha.email} />
                {isVendor && <Field label={t('crm.ficha.commercialName')} value={ficha.commercialName} />}
                {isVendor && <Field label={t('crm.ficha.website')} value={ficha.website} />}
                {isVendor && <Field label={t('crm.ficha.paymentTerms')} value={ficha.paymentTerms} />}
                {isVendor && (
                  <Field
                    label={t('crm.ficha.deliveryDays')}
                    value={ficha.deliveryDays != null ? String(ficha.deliveryDays) : null}
                  />
                )}
              </div>
              {ficha.metadataNotes && (
                <div className="mt-4 border-t border-border pt-4">
                  <span className={labelClass}>{t('crm.ficha.notes')}</span>
                  <p className="mt-1 whitespace-pre-line text-sm text-text-primary">{ficha.metadataNotes}</p>
                </div>
              )}
            </>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-bold text-text-primary">{t('crm.ficha.address')}</h2>
          {editing ? (
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <FieldInput label={t('crm.ficha.addressLine')} value={form.addressLine} onChange={(value) => setForm({ ...form, addressLine: value })} />
              <FieldInput label={t('crm.ficha.addressReference')} value={form.addressReference} onChange={(value) => setForm({ ...form, addressReference: value })} />
              <FieldInput label={t('crm.ficha.addressCity')} value={form.addressCity} onChange={(value) => setForm({ ...form, addressCity: value })} />
              <FieldInput label={t('crm.ficha.addressState')} value={form.addressState} onChange={(value) => setForm({ ...form, addressState: value })} />
              <FieldInput label={t('crm.ficha.addressCountry')} value={form.addressCountry} onChange={(value) => setForm({ ...form, addressCountry: value })} />
            </div>
          ) : ficha.address ? (
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <Field label={t('crm.ficha.addressLine')} value={ficha.address.line1} />
              <Field label={t('crm.ficha.addressReference')} value={ficha.address.line2} />
              <Field label={t('crm.ficha.addressCity')} value={ficha.address.city} />
              <Field label={t('crm.ficha.addressState')} value={ficha.address.state} />
              <Field label={t('crm.ficha.addressCountry')} value={ficha.address.country} />
            </div>
          ) : (
            <p className="text-xs text-text-secondary">{t('crm.ficha.noAddress')}</p>
          )}
        </section>

        {isVendor && (
          <section className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-3 text-sm font-bold text-text-primary">{t('crm.ficha.categories')}</h2>
            {editing ? (
              <MultiSelect
                options={(categories ?? []).map((category: any) => ({ id: category.id, label: category.name }))}
                value={categoryIds}
                onChange={setCategoryIds}
                ariaLabel={t('crm.ficha.categories')}
                placeholder={t('crm.ficha.categoriesPlaceholder')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('common.noResults')}
              />
            ) : fichaCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {fichaCategories.map((category) => (
                  <span key={category.id} className="rounded-full bg-surface-hover px-2.5 py-1 text-xs text-text-primary">
                    {category.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary">{t('crm.ficha.noCategories')}</p>
            )}
          </section>
        )}

        {isVendor && (
          <section className="rounded-lg border border-border bg-surface p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-text-primary">{t('crm.ficha.contacts')}</h2>
                <p className="mt-0.5 text-xs text-text-secondary">{t('crm.ficha.contactsHint')}</p>
              </div>
              {editing && (
                <button type="button" onClick={addContact} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary">
                  + {t('crm.ficha.addContact')}
                </button>
              )}
            </div>
            {editing ? (
              contactDrafts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-text-secondary">
                  {t('crm.ficha.noContacts')}
                </p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {contactDrafts.map((contact) => (
                    <li key={contact.key} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor={`contact-name-${contact.key}`}>{t('crm.ficha.contactName')}</label>
                        <input
                          id={`contact-name-${contact.key}`}
                          type="text"
                          value={contact.fullName}
                          onChange={(event) => updateContact(contact.key, { fullName: event.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`contact-position-${contact.key}`}>{t('crm.ficha.position')}</label>
                        {isOwnerContact(contact) ? (
                          <p className={`${valueClass} mt-2`}>{contact.position}</p>
                        ) : (
                          <select
                            id={`contact-position-${contact.key}`}
                            value={contact.position}
                            onChange={(event) => updateContact(contact.key, { position: event.target.value })}
                            className={inputClass}
                          >
                            <option value="Ventas">Ventas</option>
                            <option value="Administración">Administración</option>
                            <option value="Logística">Logística</option>
                            <option value="Encargado de pedidos">Encargado de pedidos</option>
                            <option value="Otro">Otro</option>
                          </select>
                        )}
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`contact-email-${contact.key}`}>{t('crm.ficha.email')}</label>
                        <input
                          id={`contact-email-${contact.key}`}
                          type="email"
                          value={contact.email}
                          onChange={(event) => updateContact(contact.key, { email: event.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`contact-phone-${contact.key}`}>{t('crm.ficha.phone')}</label>
                        <input
                          id={`contact-phone-${contact.key}`}
                          type="tel"
                          value={contact.phone}
                          onChange={(event) => updateContact(contact.key, { phone: event.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`contact-mobile-${contact.key}`}>{t('crm.ficha.mobile')}</label>
                        <input
                          id={`contact-mobile-${contact.key}`}
                          type="tel"
                          value={contact.mobile}
                          onChange={(event) => updateContact(contact.key, { mobile: event.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`contact-id-${contact.key}`}>{t('crm.ficha.identificationNumber')}</label>
                        <input
                          id={`contact-id-${contact.key}`}
                          type="text"
                          value={contact.identificationNumber}
                          onChange={(event) => updateContact(contact.key, { identificationNumber: event.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex items-center justify-between sm:col-span-2">
                        <label className="flex items-center gap-2 text-xs text-text-secondary">
                          <input type="radio" name="primary-contact" checked={contact.isPrimary} onChange={() => setPrimaryContact(contact.key)} />
                          {t('crm.ficha.primary')}
                        </label>
                        {!isOwnerContact(contact) && (
                          <button type="button" onClick={() => removeContact(contact.key)} className="text-xs text-text-secondary hover:text-error">
                            {t('crm.ficha.removeContact')}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : contacts.length === 0 ? (
              <p className="text-xs text-text-secondary">{t('crm.ficha.noContacts')}</p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {contacts.map((contact) => (
                  <li key={contact.id} className="grid grid-cols-1 gap-2 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <span className={labelClass}>{t('crm.ficha.contactName')}</span>
                      <p className={valueClass}>
                        {contact.fullName}
                        {contact.isPrimary && (
                          <span className="ml-2 rounded-full bg-accent-alpha px-2 py-0.5 text-[10px] font-medium text-accent">
                            {t('crm.ficha.primary')}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className={labelClass}>{t('crm.ficha.position')}</span>
                      <p className={valueClass}>{contact.position || '—'}</p>
                    </div>
                    <Field label={t('crm.ficha.email')} value={contact.email} />
                    <Field label={t('crm.ficha.phone')} value={contact.phone} />
                    <Field label={t('crm.ficha.mobile')} value={contact.mobile} />
                    <Field label={t('crm.ficha.identificationNumber')} value={contact.identificationNumber} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <p className={valueClass}>{value?.trim() ? value : '—'}</p>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="ml-0.5 text-error" aria-hidden="true">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}

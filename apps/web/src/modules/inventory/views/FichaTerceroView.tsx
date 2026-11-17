import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useCategories } from '@/shared/hooks/useCategories';
import { useUpdateVendor } from '@/modules/client-vendor/hooks/useUpdateVendor';
import { toastService } from '@/core/services/toast-service';
import { MultiSelect } from '@/shared/ui/MultiSelect';
import { applyServerErrors, clearServerErrors, FormDocumentInput, FormInput, FormSelect, resolveServerErrorMessage } from '@/shared/form';
import { fichaTerceroFormSchema, type FichaTerceroFormValues } from '@/shared/validation/ficha-tercero';
import { useFichaTercero, type ThirdPartyKind } from '../hooks/useFichaTercero';
import { ModuleSkeleton } from '@/core/components/ModuleSkeleton';
import { ReadErrorAlert } from '@/core/components/ReadErrorAlert';

interface FichaTerceroViewProps {
  id: string;
  kind: ThirdPartyKind;
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

const emptyForm: FichaTerceroFormValues = {
  legalName: '',
  documentId: '',
  identificationType: '',
  taxId: '',
  email: '',
  phone: '',
  commercialName: '',
  website: '',
  paymentTerms: '',
  deliveryDays: undefined,
  notes: '',
  categoryIds: [],
  address: {
    country: 'VE',
    state: '',
    city: '',
    addressLine: '',
    reference: '',
  },
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

  const [editDraft, setEditDraft] = useState<FichaTerceroFormValues | null>(null);
  const [contactDrafts, setContactDrafts] = useState<ContactDraft[]>([]);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues: emptyForm,
    validators: { onSubmit: fichaTerceroFormSchema },
    onSubmit: async ({ value }) => {
      if (!ficha) return;
      setServerError('');
      const addressLine = value.address.addressLine.trim();
      const validContacts = contactDrafts.filter((contact) => contact.fullName.trim());
      try {
        await updateVendor.mutateAsync({
          id: ficha.id,
          legalName: value.legalName.trim(),
          documentId: value.documentId.trim() || undefined,
          identificationType: value.identificationType || undefined,
          taxId: value.taxId.trim() || value.documentId.trim() || undefined,
          email: value.email.trim() || null,
          phone: value.phone.trim() || null,
          commercialName: value.commercialName.trim() || undefined,
          website: value.website.trim() || undefined,
          metadataNotes: value.notes.trim() || undefined,
          paymentTerms: value.paymentTerms || undefined,
          deliveryDays: value.deliveryDays,
          categoryIds: value.categoryIds,
          address: addressLine ? {
            country: value.address.country.trim(),
            state: value.address.state.trim(),
            city: value.address.city.trim(),
            addressLine,
            reference: value.address.reference.trim() || undefined,
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
        clearServerErrors(form);
        form.reset();
        setEditDraft(null);
        setServerError('');
      } catch (err) {
        const result = applyServerErrors(form, err);
        setServerError(resolveServerErrorMessage(result, t('crm.ficha.saveError')));
        toastService.error(t('crm.ficha.saveError'), t('common.saveUnconfirmed'));
      }
    },
  });

  useEffect(() => {
    if (!editDraft) return;
    clearServerErrors(form);
    form.reset(editDraft, { keepDefaultValues: true });
  }, [editDraft, form]);

  const editing = editDraft !== null;
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
    setServerError('');
    setEditDraft({
      legalName: ficha.legalName ?? '',
      documentId: ficha.documentId ?? '',
      identificationType: ficha.identificationType ?? '',
      taxId: ficha.taxId ?? '',
      email: ficha.email ?? '',
      phone: ficha.phone ?? '',
      commercialName: ficha.commercialName ?? '',
      website: ficha.website ?? '',
      paymentTerms: ficha.paymentTerms ?? '',
      deliveryDays: ficha.deliveryDays != null ? ficha.deliveryDays : undefined,
      notes: ficha.metadataNotes ?? '',
      categoryIds: fichaCategories.map((category) => category.id),
      address: {
        country: ficha.address?.country ?? 'VE',
        state: ficha.address?.state ?? '',
        city: ficha.address?.city ?? '',
        addressLine: ficha.address?.line1 ?? '',
        reference: ficha.address?.line2 ?? '',
      },
    });
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
  };

  const cancelEdit = () => {
    clearServerErrors(form);
    setEditDraft(null);
    setServerError('');
  };

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
                onClick={() => void form.handleSubmit()}
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
        {serverError && (
          <p role="alert" className="rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
            {serverError}
          </p>
        )}

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-bold text-text-primary">{t('crm.ficha.overview')}</h2>
          {editing ? (
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <FormInput form={form} name="legalName" label={t('crm.ficha.legalName')} required />
              <FormDocumentInput
                form={form}
                name="documentId"
                identificationTypeName="identificationType"
                label={t('crm.ficha.documentId')}
                allowedGroups={['RIF']}
                onValueChange={(value) => form.setFieldValue('taxId', value)}
              />
              <FormInput form={form} name="taxId" label={t('crm.ficha.taxId')} />
              <FormInput form={form} name="email" label={t('crm.ficha.email')} type="email" />
              <FormInput form={form} name="phone" label={t('crm.ficha.phone')} type="tel" />
              <FormInput form={form} name="commercialName" label={t('crm.ficha.commercialName')} />
              <FormInput form={form} name="website" label={t('crm.ficha.website')} type="url" />
              <FormSelect
                form={form}
                name="paymentTerms"
                label={t('crm.ficha.paymentTerms')}
                placeholder="—"
                options={[
                  { value: 'contado', label: 'Contado' },
                  { value: 'credito-7', label: 'Crédito 7 días' },
                  { value: 'credito-15', label: 'Crédito 15 días' },
                  { value: 'credito-30', label: 'Crédito 30 días' },
                ]}
              />
              <FormInput form={form} name="deliveryDays" label={t('crm.ficha.deliveryDays')} type="number" min={0} />
              <FormInput form={form} name="notes" label={t('crm.ficha.notes')} multiline rows={2} className="sm:col-span-2" />
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
              <FormInput form={form} name="address.addressLine" label={t('crm.ficha.addressLine')} />
              <FormInput form={form} name="address.reference" label={t('crm.ficha.addressReference')} />
              <FormInput form={form} name="address.city" label={t('crm.ficha.addressCity')} />
              <FormInput form={form} name="address.state" label={t('crm.ficha.addressState')} />
              <FormInput form={form} name="address.country" label={t('crm.ficha.addressCountry')} />
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
              <form.Subscribe selector={(state) => state.values.categoryIds}>
                {(categoryIds) => (
                  <MultiSelect
                    options={(categories ?? []).map((category: any) => ({ id: category.id, label: category.name }))}
                    value={categoryIds}
                    onChange={(value) => form.setFieldValue('categoryIds', value)}
                    ariaLabel={t('crm.ficha.categories')}
                    placeholder={t('crm.ficha.categoriesPlaceholder')}
                    searchPlaceholder={t('common.search')}
                    emptyMessage={t('common.noResults')}
                  />
                )}
              </form.Subscribe>
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

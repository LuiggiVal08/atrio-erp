import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useClients } from '@/shared/hooks/useClients';
import { useCreateClient } from '@/modules/client-vendor/hooks/useCreateClient';
import { Drawer } from '@heroui/react';
import { VirtualGrid, type GridColumn } from '@/core/components/VirtualGrid';
import { DocumentInput } from '@/shared/ui/DocumentInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { AddressInput, type AddressValues } from '@/shared/ui/AddressInput';

interface ClientRow {
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

export function ClientListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data: clients, isLoading } = useClients(search || undefined);
  const createClient = useCreateClient();

  const [legalName, setLegalName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [secondLastName, setSecondLastName] = useState('');
  const [identificationType, setIdentificationType] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<AddressValues>(emptyAddress);

  const rows: ClientRow[] = (clients ?? []).map((c: any) => ({
    id: c.id, legalName: c.legalName, documentId: c.documentId, email: c.email ?? '', phone: c.phone ?? '',
  }));

  const columns: GridColumn<ClientRow>[] = [
    { key: 'legalName', label: t('clients.legalName'), sortable: true },
    { key: 'documentId', label: t('clients.documentId'), width: 160 },
    { key: 'email', label: 'Email', width: 200 },
    { key: 'phone', label: 'Phone', width: 140 },
  ];

  const handleCreate = async () => {
    if (!legalName.trim() || !documentId.trim()) return;
    await createClient.mutateAsync({
      documentId: documentId.trim(),
      identificationType: identificationType || undefined,
      legalName: legalName.trim(),
      firstName: firstName.trim() || undefined,
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      secondLastName: secondLastName.trim() || undefined,
      taxId: taxId.trim() || documentId.trim(),
      email: email.trim() || undefined,
      phone: phone || undefined,
      addressId: undefined,
    });
    setLegalName(''); setFirstName(''); setMiddleName(''); setLastName(''); setSecondLastName('');
    setIdentificationType(''); setDocumentId(''); setTaxId('');
    setEmail(''); setPhone(''); setAddress(emptyAddress);
    setShowForm(false);
  };

  const inputClass = 'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none placeholder:text-text-secondary';

  const clientFields = (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-text-secondary">Razón Social / Nombre Completo</label>
          <input type="text" value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Primer Nombre</label>
          <input type="text" value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Otros Nombres</label>
          <input type="text" value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Primer Apellido</label>
          <input type="text" value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Segundo Apellido</label>
          <input type="text" value={secondLastName}
            onChange={(e) => setSecondLastName(e.target.value)}
            className={inputClass} />
        </div>
        <DocumentInput
          value={documentId}
          onChange={setDocumentId}
          identificationType={identificationType}
          onIdentificationTypeChange={setIdentificationType}
          label={t('clients.documentId')}
          className="col-span-2"
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">RIF / NIT</label>
          <input type="text" value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Email</label>
          <input type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass} />
        </div>
        <PhoneInput
          value={phone}
          onChange={setPhone}
          label="Teléfono"
          defaultCountry="VE"
        />
        <AddressInput
          value={address}
          onChange={setAddress}
          label="Dirección"
          className="col-span-2"
        />
      </div>
    </div>
  );

  const clientActions = (
    <div className="flex justify-end gap-3">
      <button onClick={() => setShowForm(false)}
        className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary">
        {t('common.cancel')}
      </button>
      <button onClick={handleCreate} disabled={createClient.isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
        {t('common.save')}
      </button>
    </div>
  );

  return (
    <Drawer.Root isOpen={showForm} onOpenChange={setShowForm}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h1 className="page-title">{t('clients.title')}</h1>
          <div className="flex items-center gap-3">
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              aria-label={t('common.search')}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <Drawer.Trigger className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover">
              + {t('common.create')}
            </Drawer.Trigger>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
        <div className="flex-1 rounded-xl border border-border bg-surface p-4">
          <VirtualGrid
            data={rows} columns={columns} loading={isLoading}
            emptyMessage={t('common.noResults')}
            onRowClick={(row) => navigate(`/clients/${row.id}`)}
          />
        </div>
        <Drawer.Backdrop isDismissable>
          <Drawer.Content placement="right">
            <Drawer.Dialog className="flex h-full w-full flex-col bg-overlay p-0 sm:w-[480px]">
              <Drawer.Header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                <Drawer.Heading className="font-brand text-base font-extrabold text-text-primary">
                  {t('clients.create')}
                </Drawer.Heading>
                <Drawer.CloseTrigger aria-label={t('common.close')} className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary">
                  ✕
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {clientFields}
              </Drawer.Body>
              <Drawer.Footer className="shrink-0 border-t border-border px-6 py-4">
                {clientActions}
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
        </div>
      </div>
    </Drawer.Root>
  );
}

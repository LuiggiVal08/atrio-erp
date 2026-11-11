import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ClientListView } from '@/modules/inventory/views/ClientListView';
import { VendorListView } from '@/modules/inventory/views/VendorListView';
import { FichaTerceroView } from '@/modules/inventory/views/FichaTerceroView';
import type { ThirdPartyKind } from '@/modules/inventory/hooks/useFichaTercero';

export function ClientsModule() {
  return (
    <Routes>
      <Route index element={<ClientListView />} />
      <Route path=":id" element={<ThirdPartyDetailRoute kind="client" />} />
      <Route path="*" element={<Navigate to="/clients" replace />} />
    </Routes>
  );
}

export function VendorsModule() {
  return (
    <Routes>
      <Route index element={<VendorListView />} />
      <Route path=":id" element={<ThirdPartyDetailRoute kind="vendor" />} />
      <Route path="*" element={<Navigate to="/vendors" replace />} />
    </Routes>
  );
}

function ThirdPartyDetailRoute({ kind }: { kind: ThirdPartyKind }) {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to={kind === 'vendor' ? '/vendors' : '/clients'} replace />;
  }

  return <FichaTerceroView id={id} kind={kind} />;
}

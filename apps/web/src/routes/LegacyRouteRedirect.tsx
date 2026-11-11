import { Navigate, useLocation } from 'react-router-dom';

interface LegacyRouteRedirectProps {
  from: string;
  to: string;
}

export function LegacyRouteRedirect({ from, to }: LegacyRouteRedirectProps) {
  const { pathname, search, hash } = useLocation();
  const suffix = pathname.slice(from.length);

  return <Navigate to={`${to}${suffix}${search}${hash}`} replace />;
}

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LegacyRouteRedirect } from '@/routes/LegacyRouteRedirect';

function CurrentLocation() {
  const { pathname, search, hash } = useLocation();
  return <p>{`${pathname}${search}${hash}`}</p>;
}

describe('LegacyRouteRedirect', () => {
  it.each([
    ['/inventory/clients/123', '/inventory/clients', '/clients', '/clients/123'],
    ['/inventory/vendors/456', '/inventory/vendors', '/vendors', '/vendors/456'],
    ['/inventory/employees/process/789', '/inventory/employees', '/employees', '/employees/process/789'],
    ['/inventory/fiscal', '/inventory/fiscal', '/localization/taxes', '/localization/taxes'],
    ['/inventory/currency-rates', '/inventory/currency-rates', '/localization/currency-rates', '/localization/currency-rates'],
  ])('redirects %s to its domain route', (initialPath, from, to, expectedPath) => {
    render(
      <MemoryRouter initialEntries={[`${initialPath}?view=active#top`]}>
        <Routes>
          <Route
            path={`${from}/*`}
            element={<LegacyRouteRedirect from={from} to={to} />}
          />
          <Route path="*" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(`${expectedPath}?view=active#top`)).toBeTruthy();
  });
});

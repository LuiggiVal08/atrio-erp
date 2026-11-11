import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModuleSkeleton } from '@/core/components/ModuleSkeleton';

describe('ModuleSkeleton', () => {
  it('announces the lazy module while loading', () => {
    render(<ModuleSkeleton moduleName="Inventario" />);

    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Cargando Inventario')).toBeDefined();
    expect(screen.getByText('Preparando la pantalla')).toBeDefined();
  });

  it('uses a generic module label by default', () => {
    render(<ModuleSkeleton />);
    expect(screen.getByText('Cargando módulo')).toBeDefined();
  });
});

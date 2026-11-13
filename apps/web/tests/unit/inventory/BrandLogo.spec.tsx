import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BrandLogo } from '@/modules/inventory/components/BrandLogo';

afterEach(cleanup);

describe('BrandLogo', () => {
  it('renders the logo image when provided', () => {
    const { container } = render(<BrandLogo name="Truper" logoUrl="https://cdn.test/truper.png" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/truper.png');
  });

  it('falls back to a monogram when the brand has no logo', () => {
    const { container } = render(<BrandLogo name="Herramientas Manuales" logoUrl={null} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('HM')).toBeDefined();
  });

  it('falls back to the monogram when the image fails to load', () => {
    const { container } = render(<BrandLogo name="Bosch" logoUrl="https://cdn.test/broken.png" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('B')).toBeDefined();
  });

  it('retries the image when the logo url changes', () => {
    const { container, rerender } = render(<BrandLogo name="Bosch" logoUrl="https://cdn.test/broken.png" />);
    fireEvent.error(container.querySelector('img')!);
    rerender(<BrandLogo name="Bosch" logoUrl="https://cdn.test/new.png" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/new.png');
  });
});
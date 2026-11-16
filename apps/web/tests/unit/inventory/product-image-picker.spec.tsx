import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductImagePicker } from '@/modules/inventory/components/ProductImagePicker';

function Harness() {
  const [files, setFiles] = useState<File[]>([]);
  return <ProductImagePicker files={files} onChange={setFiles} />;
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
});

afterEach(cleanup);

describe('ProductImagePicker formats', () => {
  it('rejects unsupported files and explains why', () => {
    const { container } = render(<Harness />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByRole('alert').textContent).toContain('Se omitieron 1 archivo(s) no compatibles');
    expect(screen.getByText('0/3')).toBeTruthy();
  });

  it('accepts only the same formats advertised by the server', () => {
    const { container } = render(<Harness />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'photo.webp', { type: 'image/webp' })] },
    });
    expect(screen.getByText('1/3')).toBeTruthy();
    expect(input.getAttribute('accept')).toBe('.jpg,.jpeg,.png,.webp,.gif');
  });
});

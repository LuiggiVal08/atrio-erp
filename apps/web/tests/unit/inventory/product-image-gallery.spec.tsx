import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api/client';
import { ProductImageGallery } from '@/modules/inventory/components/ProductImageGallery';

const stored = vi.hoisted(() => ({
  images: [] as { id: string; url: string; originalName: string }[],
}));

vi.mock('@/shared/lib/api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/inventory/products/p-1/images') {
        return Promise.resolve({ data: stored.images });
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn().mockImplementation((url: string, formData: FormData) => {
      if (url === '/inventory/products/p-1/images') {
        const files = formData.getAll('images') as File[];
        const uploaded = files.map((file, index) => ({
          id: `img-${stored.images.length + index + 1}`,
          url: `https://cdn.test/${file.name}`,
          originalName: file.name,
        }));
        stored.images = [...stored.images, ...uploaded];
        return Promise.resolve({ data: uploaded });
      }
      return Promise.resolve({ data: {} });
    }),
    delete: vi.fn().mockImplementation((url: string) => {
      const match = url.match(/\/images\/(.+)$/);
      if (match) stored.images = stored.images.filter((image) => image.id !== match[1]);
      return Promise.resolve({ data: {} });
    }),
  },
}));

function renderGallery(editable = false, fallbackImageUrl?: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ProductImageGallery
        productId="p-1"
        productName="Taladro"
        editable={editable}
        fallbackImageUrl={fallbackImageUrl}
      />
    </QueryClientProvider>,
  );
}

function seedImages(count: number) {
  stored.images = Array.from({ length: count }, (_, index) => ({
    id: `img-${index + 1}`,
    url: `https://cdn.test/${index + 1}.png`,
    originalName: `${index + 1}.png`,
  }));
}

function imageFile(name: string) {
  return new File(['img'], name, { type: 'image/png' });
}

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function getTrack(container: HTMLElement) {
  return container.querySelector('[data-testid="gallery-track"]') as HTMLElement;
}

let blobCounter = 0;

beforeEach(() => {
  stored.images = [];
  blobCounter = 0;
  URL.createObjectURL = vi.fn(() => `blob:mock-${++blobCounter}`);
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProductImageGallery in read mode', () => {
  it('shows a single photo without arrows or thumbnails', async () => {
    seedImages(1);
    renderGallery();

    expect((await screen.findByAltText('Taladro 1')).getAttribute('src')).toBe('https://cdn.test/1.png');
    expect(screen.queryByRole('button', { name: 'Foto siguiente' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Foto anterior' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Taladro 1' })).toBeNull();
  });

  it('cycles through photos with the arrows and wraps around', async () => {
    seedImages(3);
    const { container } = renderGallery();
    await screen.findByAltText('Taladro 1');

    expect(screen.getByText('1/3')).toBeDefined();
    expect(getTrack(container).style.transform).toContain('0%');

    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByText('2/3')).toBeDefined();
    expect(getTrack(container).style.transform).toContain('-100%');

    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByText('3/3')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByText('1/3')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Foto anterior' }));
    expect(screen.getByText('3/3')).toBeDefined();
    expect(getTrack(container).style.transform).toContain('-200%');
  });

  it('jumps to a photo from the floating thumbnails', async () => {
    seedImages(3);
    const { container } = renderGallery();
    await screen.findByAltText('Taladro 1');

    const thumb = screen.getByRole('button', { name: 'Taladro 3' });
    fireEvent.click(thumb);

    expect(screen.getByText('3/3')).toBeDefined();
    expect(thumb.getAttribute('aria-current')).toBe('true');
    expect(getTrack(container).style.transform).toContain('-200%');
    expect(screen.getByRole('button', { name: 'Taladro 1' }).getAttribute('aria-current')).toBeNull();
  });

  it('navigates with the keyboard when the gallery is focused', async () => {
    seedImages(3);
    renderGallery();
    await screen.findByAltText('Taladro 1');

    const gallery = screen.getByRole('group', { name: 'Fotos del producto' });
    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    expect(screen.getByText('2/3')).toBeDefined();

    fireEvent.keyDown(gallery, { key: 'ArrowLeft' });
    expect(screen.getByText('1/3')).toBeDefined();

    fireEvent.keyDown(gallery, { key: 'ArrowLeft' });
    expect(screen.getByText('3/3')).toBeDefined();
  });

  it('shows an empty state when the product has no photos', async () => {
    renderGallery();

    expect(await screen.findByText('Sin fotos del producto')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Foto siguiente' })).toBeNull();
  });

  it('falls back to the legacy image url', async () => {
    renderGallery(false, 'https://cdn.test/legacy.png');

    expect((await screen.findByAltText('Taladro 1')).getAttribute('src')).toBe('https://cdn.test/legacy.png');
  });
});

describe('ProductImageGallery in edit mode', () => {
  it('keeps the save button visible when 3 pending photos fill every slot', async () => {
    const { container } = renderGallery(true);
    expect(screen.queryByRole('button', { name: 'Guardar fotos' })).toBeNull();

    fireEvent.change(getFileInput(container), {
      target: { files: [imageFile('a.png'), imageFile('b.png'), imageFile('c.png')] },
    });

    expect(screen.getByText('3/3')).toBeDefined();
    expect(screen.getByAltText('Taladro 1').getAttribute('src')).toBe('blob:mock-1');
    expect(screen.getByRole('button', { name: 'Guardar fotos' })).toBeDefined();
    expect(screen.queryByText('Suelta las fotos aquí o haz clic para buscarlas')).toBeNull();
  });

  it('uploads the pending photos and replaces them with the stored ones', async () => {
    const { container } = renderGallery(true);

    fireEvent.change(getFileInput(container), {
      target: { files: [imageFile('a.png'), imageFile('b.png'), imageFile('c.png')] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar fotos' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/inventory/products/p-1/images',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
      ),
    );
    const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(formData.getAll('images')).toHaveLength(3);

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Guardar fotos' })).toBeNull());
    expect(screen.getByText('3/3')).toBeDefined();
    expect(screen.getByAltText('Taladro 1').getAttribute('src')).toBe('https://cdn.test/a.png');
  });

  it('keeps the save button when stored photos plus a pending one fill every slot', async () => {
    seedImages(2);
    const { container } = renderGallery(true);
    await screen.findByAltText('Taladro 1');

    fireEvent.change(getFileInput(container), { target: { files: [imageFile('c.png')] } });

    expect(screen.getByText('3/3')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Guardar fotos' })).toBeDefined();
  });

  it('marks pending photos as unsaved and offers an add tile', async () => {
    seedImages(1);
    const { container } = renderGallery(true);
    await screen.findByAltText('Taladro 1');

    expect(screen.getByRole('button', { name: 'Agregar foto' })).toBeDefined();

    fireEvent.change(getFileInput(container), { target: { files: [imageFile('b.png')] } });

    expect(screen.getByText('Sin guardar')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByText('2/2')).toBeDefined();
    expect(screen.getByAltText('Taladro 2').getAttribute('src')).toBe('blob:mock-1');
  });

  it('deletes the current photo and clamps the position', async () => {
    seedImages(2);
    renderGallery(true);
    await screen.findByAltText('Taladro 1');

    fireEvent.click(screen.getByRole('button', { name: 'Quitar foto' }));

    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith('/inventory/products/p-1/images/img-1'),
    );
    await waitFor(() =>
      expect(screen.getByAltText('Taladro 1').getAttribute('src')).toBe('https://cdn.test/2.png'),
    );
    expect(screen.queryByRole('button', { name: 'Foto siguiente' })).toBeNull();
  });
});

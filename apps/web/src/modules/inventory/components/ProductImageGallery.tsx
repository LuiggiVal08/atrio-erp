import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, ImagePlus, Plus, Upload, X } from 'lucide-react';
import {
  useDeleteProductImage,
  useDeleteProductImageById,
  useProductImages,
  useUploadProductImages,
  type ProductImage,
} from '../hooks/useProductImage';
import { useTranslation } from '@/shared/hooks/useTranslation';

const MAX_IMAGES = 3;

interface ProductImageGalleryProps {
  productId: string;
  fallbackImageUrl?: string | null;
  productName: string;
  editable: boolean;
}

interface PendingImage {
  file: File;
  previewUrl: string;
}

type Slide =
  | { type: 'stored'; image: ProductImage }
  | { type: 'pending'; image: PendingImage };

const overlayChipClass = 'border border-white/10 bg-black/45 text-white backdrop-blur-md';

export function ProductImageGallery({
  productId,
  fallbackImageUrl,
  productName,
  editable,
}: ProductImageGalleryProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [requestedIndex, setRequestedIndex] = useState(0);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const { data: images = [], isLoading } = useProductImages(productId);
  const uploadImages = useUploadProductImages();
  const deleteImage = useDeleteProductImageById();
  const deleteLegacyImage = useDeleteProductImage();

  const storedImages: ProductImage[] = images.length
    ? images
    : fallbackImageUrl
      ? [{ id: 'legacy-image', url: fallbackImageUrl, originalName: '' }]
      : [];

  const slides: Slide[] = [
    ...storedImages.map((image) => ({ type: 'stored' as const, image })),
    ...pendingImages.map((image) => ({ type: 'pending' as const, image })),
  ];
  const remainingSlots = MAX_IMAGES - slides.length;
  const index = slides.length ? Math.min(requestedIndex, slides.length - 1) : 0;
  const current = slides[index];
  const hasNavigation = slides.length > 1;

  const goTo = (next: number) => {
    if (!slides.length) return;
    setRequestedIndex((next + slides.length) % slides.length);
  };

  const addFiles = (files: File[]) => {
    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!validFiles.length || remainingSlots <= 0) return;
    setPendingImages((currentPending) => [
      ...currentPending,
      ...validFiles.slice(0, remainingSlots).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (editable) addFiles(Array.from(event.dataTransfer.files));
  };

  const removePending = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    setPendingImages((currentPending) =>
      currentPending.filter((image) => image.previewUrl !== previewUrl),
    );
  };

  const handleUpload = async () => {
    if (!pendingImages.length) return;
    const firstUploadedIndex = storedImages.length;
    await uploadImages.mutateAsync({
      id: productId,
      files: pendingImages.map(({ file }) => file),
    });
    pendingImages.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    setPendingImages([]);
    setRequestedIndex(firstUploadedIndex);
  };

  const handleDeleteCurrent = async () => {
    if (!current) return;
    if (current.type === 'pending') {
      removePending(current.image.previewUrl);
      return;
    }
    if (current.image.id === 'legacy-image') {
      await deleteLegacyImage.mutateAsync(productId);
      return;
    }
    await deleteImage.mutateAsync({ id: productId, fileId: current.image.id });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasNavigation) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {t('inventory.product.images')}
        </h2>
        {editable && (
          <span className="font-mono text-xs text-text-secondary">
            {slides.length}/{MAX_IMAGES}
          </span>
        )}
      </div>

      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={t('inventory.product.images')}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          if (!editable) return;
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative aspect-square overflow-hidden rounded-xl border bg-canvas transition-shadow ${
          isDragging ? 'border-accent ring-2 ring-accent-glow' : 'border-border'
        }`}
      >
        {isLoading && !slides.length ? (
          <div className="flex h-full items-center justify-center text-sm text-text-secondary">
            {t('common.loading')}
          </div>
        ) : slides.length ? (
          <>
            <div
              data-testid="gallery-track"
              className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {slides.map((slide, slideIndex) => (
                <div
                  key={slide.type === 'stored' ? slide.image.id : slide.image.previewUrl}
                  aria-hidden={slideIndex !== index}
                  className="relative h-full w-full shrink-0"
                >
                  <img
                    src={slide.type === 'stored' ? slide.image.url : slide.image.previewUrl}
                    alt={`${productName} ${slideIndex + 1}`}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                  {slide.type === 'pending' && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-warning px-2 py-0.5 text-[10px] font-semibold text-black">
                      {t('inventory.product.pendingImage')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {hasNavigation && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  aria-label={t('inventory.product.previousImage')}
                  className={`absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-black/70 ${overlayChipClass}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  aria-label={t('inventory.product.nextImage')}
                  className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-black/70 ${overlayChipClass}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span
                  aria-live="polite"
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 font-mono text-[11px] ${overlayChipClass}`}
                >
                  {index + 1}/{slides.length}
                </span>
              </>
            )}

            {editable && current && (
              <button
                type="button"
                onClick={handleDeleteCurrent}
                disabled={deleteImage.isPending || deleteLegacyImage.isPending}
                aria-label={t('inventory.product.removeImage')}
                className={`absolute right-2 top-2 z-10 rounded-full p-1.5 transition-colors hover:bg-error disabled:opacity-50 ${overlayChipClass}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {(hasNavigation || (editable && remainingSlots > 0)) && (
              <div
                className={`absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg p-1 shadow-lg ${overlayChipClass}`}
              >
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.type === 'stored' ? slide.image.id : slide.image.previewUrl}
                    type="button"
                    onClick={() => goTo(slideIndex)}
                    aria-label={`${productName} ${slideIndex + 1}`}
                    aria-current={slideIndex === index ? 'true' : undefined}
                    className={`h-9 w-9 shrink-0 overflow-hidden rounded-md transition-all ${
                      slideIndex === index
                        ? 'opacity-100 ring-2 ring-white'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={slide.type === 'stored' ? slide.image.url : slide.image.previewUrl}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
                {editable && remainingSlots > 0 && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    aria-label={t('inventory.product.addImage')}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-white/40 text-white/80 transition-colors hover:border-white hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </>
        ) : editable ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
            }}
            className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-center text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <ImagePlus className="h-8 w-8 text-text-muted" />
            <span className="px-4 text-xs">{t('inventory.product.dropImages')}</span>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-text-muted">
            <ImageIcon className="h-8 w-8" />
            <span className="px-4 text-xs">{t('inventory.product.noImages')}</span>
          </div>
        )}
      </div>

      {editable && (
        <p className="mt-2 text-xs text-text-secondary">{t('inventory.product.imagesHint')}</p>
      )}

      {editable && remainingSlots > 0 && slides.length > 0 && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
          }}
          className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-xs transition-colors ${
            isDragging
              ? 'border-accent bg-accent-alpha text-text-primary'
              : 'border-border-light text-text-secondary hover:border-accent hover:text-text-primary'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>{t('inventory.product.dropImages')}</span>
        </div>
      )}

      {editable && !!pendingImages.length && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploadImages.isPending}
          className="mt-3 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {uploadImages.isPending ? t('common.loading') : t('inventory.product.uploadImages')}
        </button>
      )}

      {editable && remainingSlots > 0 && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      )}
    </div>
  );
}

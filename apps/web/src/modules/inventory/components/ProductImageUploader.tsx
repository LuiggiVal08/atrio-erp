import { useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import {
  useDeleteProductImage,
  useDeleteProductImageById,
  useProductImages,
  useUploadProductImages,
  type ProductImage,
} from '../hooks/useProductImage';
import { useTranslation } from '@/shared/hooks/useTranslation';

const MAX_IMAGES = 3;

interface ProductImageUploaderProps {
  productId: string;
  fallbackImageUrl?: string | null;
  productName: string;
  editable: boolean;
}

interface PendingImage {
  file: File;
  previewUrl: string;
}

export function ProductImageUploader({
  productId,
  fallbackImageUrl,
  productName,
  editable,
}: ProductImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
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
  const remainingSlots = MAX_IMAGES - storedImages.length - pendingImages.length;

  const addFiles = (files: File[]) => {
    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!validFiles.length || remainingSlots <= 0) return;
    setPendingImages((current) => [
      ...current,
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
    addFiles(Array.from(event.dataTransfer.files));
  };

  const removePending = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    setPendingImages((current) => current.filter((image) => image.previewUrl !== previewUrl));
  };

  const handleUpload = async () => {
    if (!pendingImages.length) return;
    await uploadImages.mutateAsync({
      id: productId,
      files: pendingImages.map(({ file }) => file),
    });
    pendingImages.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    setPendingImages([]);
  };

  const handleDelete = async (image: ProductImage) => {
    if (image.id === 'legacy-image') {
      await deleteLegacyImage.mutateAsync(productId);
      return;
    }
    await deleteImage.mutateAsync({ id: productId, fileId: image.id });
  };

  const slots = [
    ...storedImages.map((image) => ({ type: 'stored' as const, image })),
    ...pendingImages.map((image) => ({ type: 'pending' as const, image })),
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary">{t('inventory.product.images')}</h2>
          <p className="mt-1 text-xs text-text-secondary">{t('inventory.product.imagesHint')}</p>
        </div>
        <span className="font-mono text-xs text-text-secondary">{slots.length}/{MAX_IMAGES}</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">{t('common.loading')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((slot) => {
            const item = slots[slot];
            return (
              <div
                key={item?.type === 'stored' ? item.image.id : item?.image.previewUrl ?? slot}
                className="relative aspect-square overflow-hidden rounded-lg border border-border bg-canvas"
              >
                {item ? (
                  <>
                    <img
                      src={item.type === 'stored' ? item.image.url : item.image.previewUrl}
                      alt={`${productName} ${slot + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {editable && (
                      <button
                        type="button"
                        onClick={() =>
                          item.type === 'stored'
                            ? handleDelete(item.image)
                            : removePending(item.image.previewUrl)
                        }
                        className="absolute right-2 top-2 rounded-full bg-canvas/90 p-1.5 text-text-primary shadow-sm hover:bg-error hover:text-white"
                        aria-label={t('inventory.product.removeImage')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </>
                ) : editable ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-text-secondary">
                    <ImagePlus className="h-7 w-7 text-text-muted" />
                    <span className="px-3 text-xs">{t('inventory.product.imageSlot')}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {editable && remainingSlots > 0 && (
        <>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mt-4 flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm transition-colors ${
              isDragging
                ? 'border-accent bg-accent-alpha text-text-primary'
                : 'border-border-light text-text-secondary hover:border-accent hover:text-text-primary'
            }`}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
            }}
          >
            <Upload className="h-4 w-4" />
            <span>{t('inventory.product.dropImages')}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {!!pendingImages.length && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploadImages.isPending}
              className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {uploadImages.isPending ? t('common.loading') : t('inventory.product.uploadImages')}
            </button>
          )}
        </>
      )}
    </div>
  );
}

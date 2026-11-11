import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';

const MAX_IMAGES = 3;

interface ProductImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export function ProductImagePicker({ files, onChange }: ProductImagePickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  const addFiles = (selectedFiles: File[]) => {
    const images = selectedFiles.filter((file) => file.type.startsWith('image/'));
    onChange([...files, ...images].slice(0, MAX_IMAGES));
  };

  return (
    <div className="col-span-2 rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <label className="block text-xs font-medium text-text-secondary">{t('inventory.product.images')}</label>
          <p className="mt-1 text-xs text-text-muted">{t('inventory.product.imagesHint')}</p>
        </div>
        <span className="font-mono text-xs text-text-secondary">{files.length}/{MAX_IMAGES}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((index) => {
          const preview = previews[index];
          return (
            <div key={index} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-canvas">
              {preview ? (
                <>
                  <img src={preview.url} alt={`${t('inventory.product.imageSlot')} ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
                    className="absolute right-1.5 top-1.5 rounded-full bg-canvas/90 p-1 text-text-primary hover:bg-error hover:text-white"
                    aria-label={t('inventory.product.removeImage')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-text-muted">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[11px]">{t('inventory.product.imageSlot')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {files.length < MAX_IMAGES && (
        <div
          className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-xs transition-colors ${
            isDragging ? 'border-accent bg-accent-alpha text-text-primary' : 'border-border-light text-text-secondary hover:border-accent hover:text-text-primary'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(Array.from(event.dataTransfer.files));
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
          }}
        >
          <Upload className="h-4 w-4" />
          {t('inventory.product.dropImages')}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
}

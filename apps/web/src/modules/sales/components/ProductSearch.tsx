import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { usePOSStore, type ProductSearchResult } from '@/modules/sales/store/pos-store';

interface ProductSearchProps {
  onSelect: (product: ProductSearchResult) => void;
}

export function ProductSearch({ onSelect }: ProductSearchProps) {
  const { t } = useTranslation();
  const { searchQuery, setSearchQuery, searchFocused, setSearchFocused } = usePOSStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setResults([]);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (searchFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchFocused]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchFocused]);

  const handleSelect = useCallback(
    (product: ProductSearchResult) => {
      onSelect(product);
      setSearchQuery('');
      setResults([]);
      inputRef.current?.focus();
    },
    [onSelect, setSearchQuery],
  );

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          placeholder={t('sales.pos.searchPlaceholder')}
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 pl-10 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
        />
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery.length > 0 && (
          <button
            onClick={() => { setSearchQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {searchQuery.length < 2 && searchQuery.length > 0 && (
        <p className="mt-1 text-xs text-text-secondary">{t('sales.pos.searchEmpty')}</p>
      )}
      {loading && (
        <div className="mt-1 flex items-center gap-2 px-1 py-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-xs text-text-secondary">{t('common.loading')}</span>
        </div>
      )}
      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-surface shadow-lg">
          {results.map((product) => (
            <button
              key={product.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(product)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-surface-hover"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{product.name}</p>
                <p className="text-xs text-text-secondary">{product.sku}</p>
              </div>
              <span className="text-sm font-semibold text-accent">
                {product.price.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </button>
          ))}
        </div>
      )}
      {searchQuery.length >= 2 && !loading && results.length === 0 && (
        <p className="mt-1 text-xs text-text-secondary">
          {t('sales.pos.noResults')} &quot;{searchQuery}&quot;
        </p>
      )}
    </div>
  );
}

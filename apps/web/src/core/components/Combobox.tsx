import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';

export interface ComboboxOption {
  id: string;
  name: string;
}

interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (id: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  'aria-label': ariaLabel,
}: ComboboxProps) {
  const { t } = useTranslation();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((o) => o.id === value);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter((o) => normalize(o.name).includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const openList = () => {
    if (disabled) return;
    setQuery('');
    setActiveIndex(options.findIndex((o) => o.id === value));
    setOpen(true);
  };

  const select = (option: ComboboxOption) => {
    onChange(option.id);
    setOpen(false);
    setQuery('');
    if (document.activeElement !== inputRef.current) inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) openList();
      else setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) openList();
      else setActiveIndex((i) => (i < 0 ? filtered.length - 1 : Math.max(i - 1, 0)));
    } else if (e.key === 'Home' && open) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End' && open) {
      e.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault();
        if (filtered[activeIndex]) select(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const activeOption = open ? filtered[activeIndex] : undefined;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
        aria-label={ariaLabel}
        autoComplete="off"
        disabled={disabled}
        className="w-full rounded-lg border border-border bg-canvas py-2 pl-3 pr-14 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        value={open ? query : (selected?.name ?? '')}
        placeholder={open ? t('common.search') : (placeholder ?? t('common.select'))}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={openList}
        onClick={() => {
          if (!open) openList();
        }}
        onKeyDown={handleKeyDown}
      />
      <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={t('common.clear')}
            className="rounded p-0.5 text-text-secondary hover:text-text-primary"
            onClick={() => {
              onChange('');
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-label={t('common.select')}
          disabled={disabled}
          className="rounded p-0.5 text-text-secondary hover:text-text-primary disabled:opacity-50"
          onClick={() => {
            if (open) setOpen(false);
            else {
              openList();
              inputRef.current?.focus();
            }
          }}
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-overlay py-1 shadow-xl shadow-black/30"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-text-secondary">{t('common.noResults')}</li>
          )}
          {filtered.map((option, index) => {
            const isSelected = option.id === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.id}
                id={`${listId}-${option.id}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                  isActive ? 'bg-accent-alpha text-accent' : 'text-text-primary'
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(option)}
              >
                <span className="truncate">{option.name}</span>
                {isSelected && <Check size={14} aria-hidden="true" className="shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

export interface MultiSelectOption {
  id: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  ariaLabel: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

const triggerClass =
  'flex min-h-[38px] w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-canvas px-2 py-1.5 text-sm text-text-primary focus:outline-none focus-visible:border-accent'

const chipClass =
  'inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent'

const searchClass =
  'w-full rounded-md border border-border bg-canvas px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none placeholder:text-text-secondary'

export function MultiSelect({
  options,
  value,
  onChange,
  ariaLabel,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
  disabled = false,
  className = '',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const selectedOptions = useMemo(
    () => value.map((id) => options.find((opt) => opt.id === id)).filter((opt): opt is MultiSelectOption => Boolean(opt)),
    [value, options],
  )

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(term))
  }, [options, query])

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const remove = (id: string) => {
    onChange(value.filter((v) => v !== id))
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className={`${triggerClass} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        {selectedOptions.length === 0 ? (
          <span className="px-1 text-text-secondary">{placeholder}</span>
        ) : (
          selectedOptions.map((opt) => (
            <span key={opt.id} className={chipClass}>
              {opt.label}
              <button
                type="button"
                aria-label={`Quitar ${opt.label}`}
                onClick={(e) => {
                  e.stopPropagation()
                  remove(opt.id)
                }}
                className="rounded-full text-accent/70 hover:text-accent focus:outline-none"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`ml-auto shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && (
        <div className="mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className={searchClass}
            />
          </div>
          <ul role="listbox" aria-multiselectable="true" aria-label={ariaLabel} className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-sm text-text-secondary">{emptyMessage}</li>
            )}
            {filteredOptions.map((opt) => {
              const selected = value.includes(opt.id)
              return (
                <li key={opt.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm transition-colors hover:bg-surface-hover ${
                      selected ? 'bg-accent/10 font-semibold text-accent' : 'text-text-primary'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected ? 'border-accent bg-accent text-white' : 'border-border'
                      }`}
                    >
                      {selected && <Check size={12} aria-hidden="true" />}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
            <span className="text-[11px] text-text-secondary">
              {value.length} seleccionada{value.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setQuery('')
              }}
              className="rounded-md px-2 py-1 text-xs font-semibold text-accent hover:bg-surface-hover focus:outline-none"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

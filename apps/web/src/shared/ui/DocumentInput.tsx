import { useRef, useCallback, useMemo, type ChangeEvent } from 'react'
import { findIdentificationType, DOCUMENT_TYPE_GROUPS, resolveCode, getTypeFromCode } from '@/shared/lib/identification-types'
import { FieldLabel } from './FieldLabel'

interface DocumentInputProps {
  value: string
  onChange: (unformatted: string) => void
  identificationType: string
  onIdentificationTypeChange?: (type: string) => void
  country?: string
  label?: string
  description?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  allowedGroups?: string[]
  className?: string
}

const inputClass =
  'flex-1 min-w-0 rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none placeholder:text-text-secondary'

const selectClass =
  'rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none'

export function DocumentInput({
  value,
  onChange,
  identificationType,
  onIdentificationTypeChange,
  country,
  label,
  description,
  placeholder,
  error,
  disabled,
  allowedGroups,
  className = '',
}: DocumentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const def = findIdentificationType(identificationType)
  const currentGroupType = useMemo(() => getTypeFromCode(identificationType), [identificationType])
  const groups = useMemo(
    () => (allowedGroups ? DOCUMENT_TYPE_GROUPS.filter((g) => allowedGroups.includes(g.type)) : DOCUMENT_TYPE_GROUPS),
    [allowedGroups],
  )

  const handleTypeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const selectedType = e.target.value
      if (!selectedType) {
        onIdentificationTypeChange?.('')
        onChange('')
        return
      }
      const code = resolveCode(selectedType, country)
      onIdentificationTypeChange?.(code)
      onChange('')
    },
    [country, onIdentificationTypeChange, onChange],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (def) {
        const unformatted = def.unformat(raw)
        onChange(unformatted)
      } else {
        onChange(raw)
      }
    },
    [def, onChange],
  )

  const displayValue = def ? def.format(value) : value

  return (
    <div className={className}>
      {label && (
        <FieldLabel label={label} description={description} />
      )}
      <div className="flex gap-2">
        {onIdentificationTypeChange && (
          <select
            value={currentGroupType ?? ''}
            onChange={handleTypeChange}
            className={selectClass + ' w-44 shrink-0'}
            disabled={disabled}
          >
            <option value="">Seleccionar</option>
            {groups.map((g) => (
              <option key={g.type} value={g.type}>
                {g.label}
              </option>
            ))}
          </select>
        )}
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder ?? (def ? def.mask : 'Número de documento')}
          disabled={disabled || !identificationType}
          className={inputClass + (error ? ' border-red-500' : '')}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

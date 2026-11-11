interface AddressValues {
  country: string
  state: string
  city: string
  addressLine: string
  reference?: string
}

interface AddressInputProps {
  value: AddressValues
  onChange: (value: AddressValues) => void
  label?: string
  error?: string
  disabled?: boolean
  className?: string
}

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none placeholder:text-text-secondary'

const COUNTRIES = [
  { code: 'VE', label: 'Venezuela' },
  { code: 'CO', label: 'Colombia' },
]

export function AddressInput({
  value,
  onChange,
  label,
  error,
  disabled,
  className = '',
}: AddressInputProps) {
  const set = (field: keyof AddressValues, v: string) => {
    onChange({ ...value, [field]: v })
  }

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select
          value={value.country}
          onChange={(e) => set('country', e.target.value)}
          className={inputClass}
          disabled={disabled}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={value.state}
          onChange={(e) => set('state', e.target.value)}
          placeholder="Estado / Departamento"
          className={inputClass}
          disabled={disabled}
        />
        <input
          type="text"
          value={value.city}
          onChange={(e) => set('city', e.target.value)}
          placeholder="Ciudad"
          className={inputClass}
          disabled={disabled}
        />
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={value.addressLine}
          onChange={(e) => set('addressLine', e.target.value)}
          placeholder="Dirección (calle, #, urbanización)"
          className={`${inputClass} sm:col-span-2`}
          disabled={disabled}
        />
        <input
          type="text"
          value={value.reference ?? ''}
          onChange={(e) => set('reference', e.target.value)}
          placeholder="Punto de referencia"
          className={inputClass}
          disabled={disabled}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export type { AddressValues }

import PhoneInputLib from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  defaultCountry?: string
}

export function PhoneInput({
  value,
  onChange,
  label,
  error,
  disabled,
  className = '',
  defaultCountry = 'VE',
}: PhoneInputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div
        className={`w-full rounded-lg border border-border bg-canvas text-sm text-text-primary focus-within:border-accent [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:text-text-primary [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-text-secondary ${error ? 'border-red-500' : ''}`}
      >
        <PhoneInputLib
          international
          countrySelectProps={{ disabled }}
          defaultCountry={defaultCountry as any}
          value={value || undefined}
          onChange={(v) => onChange(v ?? '')}
          disabled={disabled}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

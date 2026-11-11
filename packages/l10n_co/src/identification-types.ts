export interface IdentificationTypeDef {
  code: string
  label: string
  country: 'CO'
  mask: string
  pattern: RegExp
  format(raw: string): string
  unformat(formatted: string): string
}

const DIGITS_3_SEP = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const IDENTIFICATION_TYPES_CO: IdentificationTypeDef[] = [
  {
    code: 'CC_CO',
    label: 'Cédula de Ciudadanía',
    country: 'CO',
    mask: '#.###.###.###',
    pattern: /^\d{6,10}$/,
    format(raw: string) {
      const digits = raw.replace(/\D/g, '')
      return DIGITS_3_SEP(digits)
    },
    unformat(formatted: string) {
      return formatted.replace(/\D/g, '')
    },
  },
  {
    code: 'CE_CO',
    label: 'Cédula de Extranjería',
    country: 'CO',
    mask: '#.###.###.###',
    pattern: /^\d{6,10}$/,
    format(raw: string) {
      const digits = raw.replace(/\D/g, '')
      return DIGITS_3_SEP(digits)
    },
    unformat(formatted: string) {
      return formatted.replace(/\D/g, '')
    },
  },
  {
    code: 'NIT_CO',
    label: 'NIT (###.###.###-#)',
    country: 'CO',
    mask: '###.###.###-#',
    pattern: /^\d{9,10}$/,
    format(raw: string) {
      const digits = raw.replace(/\D/g, '')
      if (!digits) return ''
      if (digits.length <= 1) return digits
      let formatted = DIGITS_3_SEP(digits.slice(0, -1))
      formatted = formatted + '-' + digits.slice(-1)
      return formatted
    },
    unformat(formatted: string) {
      return formatted.replace(/\D/g, '')
    },
  },
  {
    code: 'TI_CO',
    label: 'Tarjeta de Identidad',
    country: 'CO',
    mask: '#.###.###.###',
    pattern: /^\d{6,10}$/,
    format(raw: string) {
      const digits = raw.replace(/\D/g, '')
      return DIGITS_3_SEP(digits)
    },
    unformat(formatted: string) {
      return formatted.replace(/\D/g, '')
    },
  },
  {
    code: 'PASS_CO',
    label: 'Pasaporte',
    country: 'CO',
    mask: 'AAAA######',
    pattern: /^[A-Za-z]{2,}\d{4,}$/,
    format(raw: string) {
      return raw.toUpperCase()
    },
    unformat(formatted: string) {
      return formatted.toUpperCase()
    },
  },
]

export const ALL_IDENTIFICATION_TYPES = [...IDENTIFICATION_TYPES_CO]

export function findByIdentificationType(code: string): IdentificationTypeDef | undefined {
  return ALL_IDENTIFICATION_TYPES.find((t) => t.code === code)
}

export interface IdentificationTypeDef {
  code: string
  label: string
  country: string
  mask: string
  format(raw: string): string
  unformat(formatted: string): string
}

export interface DocumentTypeGroup {
  type: string
  label: string
  description: string
  codes: string[]
}

const DIGITS_3_SEP = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const IDENTIFICATION_TYPES: IdentificationTypeDef[] = [
  {
    code: 'CI_VE',
    label: 'Cédula de Identidad (V-)',
    country: 'VE',
    mask: 'V-###.###.###',
    format(raw: string) {
      const cleaned = raw.replace(/[^Vv\d]/g, '').toUpperCase()
      if (!cleaned) return ''
      const prefix = cleaned.startsWith('V') ? 'V-' : ''
      const digits = cleaned.replace(/V/i, '')
      return prefix + DIGITS_3_SEP(digits)
    },
    unformat(formatted: string) {
      return formatted.replace(/[^\dV]/gi, '').toUpperCase()
    },
  },
  {
    code: 'RIF_VE',
    label: 'RIF (J-###.###.###-#)',
    country: 'VE',
    mask: 'F-###.###.###-#',
    format(raw: string) {
      const cleaned = raw.replace(/[^\w\d]/g, '').toUpperCase()
      if (!cleaned) return ''
      const letter = cleaned.match(/^[VEJGP]/i)?.[0] ?? ''
      const rest = cleaned.replace(/^[VEJGP]/i, '').replace(/\D/g, '')
      if (!rest) return letter
      if (rest.length <= 1) return letter + '-' + rest
      const checkDigit = rest.slice(-1)
      const mainDigits = rest.slice(0, -1)
      return letter + '-' + DIGITS_3_SEP(mainDigits) + '-' + checkDigit
    },
    unformat(formatted: string) {
      return formatted.replace(/[^\w\d]/g, '').toUpperCase()
    },
  },
  {
    code: 'PASS_VE',
    label: 'Pasaporte',
    country: 'VE',
    mask: 'AAA######',
    format(raw: string) {
      return raw.toUpperCase()
    },
    unformat(formatted: string) {
      return formatted.toUpperCase()
    },
  },
  {
    code: 'CC_CO',
    label: 'Cédula de Ciudadanía',
    country: 'CO',
    mask: '###.###.###',
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
    mask: '###.###.###',
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
    format(raw: string) {
      const digits = raw.replace(/\D/g, '')
      if (!digits) return ''
      if (digits.length <= 1) return digits
      const checkDigit = digits.slice(-1)
      const mainDigits = digits.slice(0, -1)
      return DIGITS_3_SEP(mainDigits) + '-' + checkDigit
    },
    unformat(formatted: string) {
      return formatted.replace(/\D/g, '')
    },
  },
  {
    code: 'TI_CO',
    label: 'Tarjeta de Identidad',
    country: 'CO',
    mask: '###.###.###',
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
    mask: 'AAA######',
    format(raw: string) {
      return raw.toUpperCase()
    },
    unformat(formatted: string) {
      return formatted.toUpperCase()
    },
  },
]

export const DOCUMENT_TYPE_GROUPS: DocumentTypeGroup[] = [
  { type: 'CI', label: 'Cédula de Identidad', description: 'Cédula de Identidad o Ciudadanía', codes: ['CI_VE', 'CC_CO'] },
  { type: 'RIF', label: 'RIF / NIT', description: 'Registro de Información Fiscal / NIT', codes: ['RIF_VE', 'NIT_CO'] },
  { type: 'PAS', label: 'Pasaporte', description: 'Pasaporte', codes: ['PASS_VE', 'PASS_CO'] },
  { type: 'CE', label: 'Cédula de Extranjería', description: 'Cédula de Extranjería', codes: ['CE_CO'] },
  { type: 'TI', label: 'Tarjeta de Identidad', description: 'Tarjeta de Identidad', codes: ['TI_CO'] },
]

export function findIdentificationType(code: string): IdentificationTypeDef | undefined {
  return IDENTIFICATION_TYPES.find((t) => t.code === code)
}

export function getTypesByCountry(country: string): IdentificationTypeDef[] {
  return IDENTIFICATION_TYPES.filter((t) => t.country === country)
}

export function resolveCode(type: string, country?: string): string {
  const group = DOCUMENT_TYPE_GROUPS.find((g) => g.type === type)
  if (!group) return ''
  const match = country
    ? group.codes.find((c) => IDENTIFICATION_TYPES.find((t) => t.code === c)?.country === country)
    : undefined
  return match ?? group.codes[0]
}

export function getTypeFromCode(code: string): string | undefined {
  return DOCUMENT_TYPE_GROUPS.find((g) => g.codes.includes(code))?.type
}

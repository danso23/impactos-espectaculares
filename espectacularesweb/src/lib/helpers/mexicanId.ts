export const RFC_REGEX = /^(?:[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}|X{12,13})$/

export const CURP_REGEX = /^(?:[A-Z][AEIOUX][A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d|X{18})$/

export function isValidRfc(value?: string | null) {
  return !value || RFC_REGEX.test(value)
}

export function isValidCurp(value?: string | null) {
  return !value || CURP_REGEX.test(value)
}

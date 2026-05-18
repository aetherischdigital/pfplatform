/**
 * Parse a user-typed money string into a number. Strips $, commas, and
 * whitespace so "$1,250.50" and "1250.5" both parse. Returns null for an
 * empty or non-numeric string — callers must treat null as a validation
 * failure rather than a zero. (Number('') === 0 would otherwise pass a
 * naïve finite-check and silently persist a $0 record.)
 */
export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

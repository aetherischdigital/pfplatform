/**
 * Shared input/select/textarea styling. Single source of truth for form-field
 * appearance — surface-tinted background, surface-200 border, accent ring on
 * focus, all driven by theme tokens so dark mode comes along for free.
 */

const fieldBase =
  'w-full rounded-md border border-surface-200 bg-surface-50 text-sm text-surface-900 outline-none placeholder:text-surface-400 transition-colors focus:border-surface-400 focus:bg-white'

/** Default field with standard horizontal padding. */
export const formFieldClass = `${fieldBase} px-3 py-2.5`

/** Variant with extra left padding to make room for a leading icon. */
export const formFieldWithIconClass = `${fieldBase} py-2.5 pl-9 pr-3`

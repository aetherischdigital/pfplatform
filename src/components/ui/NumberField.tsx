import { formFieldClass } from './formStyles'

/**
 * Number input with optional prefix/suffix adornment. Used across every
 * calculator on /app/calculators. Keep API minimal — calculators that need
 * richer behavior (validation messages, formatted display) should build on
 * top of this, not fork it.
 */
export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = 0,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  min?: number
  /** Optional hint shown below the input (e.g. units, examples). */
  hint?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-surface-700">{label}</span>
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => {
            const n = Number(e.target.value)
            onChange(Number.isFinite(n) ? Math.max(min, n) : min)
          }}
          step={step}
          min={min}
          className={`${formFieldClass} text-base ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-16' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-surface-500">{hint}</p>}
    </label>
  )
}

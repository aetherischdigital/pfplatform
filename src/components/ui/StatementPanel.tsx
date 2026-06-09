import type { ReactNode } from 'react'

/**
 * A financial-statement surface: a labelled header band over a body. This is the
 * shared replacement for the faux-browser-chrome mockup and the generic
 * rounded-2xl drop-shadow cards used for product previews. Tabular figures and
 * hairline rules belong inside it.
 *
 *  - surface="cream"  sits well on dark backgrounds (the hero)
 *  - elevated         uses the larger shadow for floating previews
 */
type Props = {
  label: string
  meta?: string
  surface?: 'cream' | 'white'
  elevated?: boolean
  className?: string
  children: ReactNode
}

export default function StatementPanel({
  label,
  meta,
  surface = 'white',
  elevated = false,
  className = '',
  children,
}: Props) {
  const bg = surface === 'cream' ? 'bg-surface-50' : 'bg-white'
  const shadow = elevated ? 'shadow-card-lg' : 'shadow-card'
  return (
    <div
      className={`overflow-hidden rounded-lg border border-surface-200 text-surface-900 ${bg} ${shadow} ${className}`}
    >
      <div className="flex items-center justify-between border-b border-surface-200 px-5 py-3">
        <span className="font-label text-[11px] uppercase tracking-[0.24em] text-accent-600">
          {label}
        </span>
        {meta && <span className="font-mono text-[11px] text-surface-400">{meta}</span>}
      </div>
      {children}
    </div>
  )
}

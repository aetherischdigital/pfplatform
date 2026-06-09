import type { ReactNode } from 'react'

/**
 * Section eyebrow — a short rule followed by a wide-tracked monospace label.
 * The shared replacement for the old ✨-pill badges and the scattered
 * `font-mono uppercase tracking-wider` kickers. Part of the "ledger" language.
 *
 * `tone="light"` for placement on dark surfaces (hero, mid-CTA bands).
 */
type Props = { children: ReactNode; tone?: 'dark' | 'light'; className?: string }

export default function Kicker({ children, tone = 'dark', className = '' }: Props) {
  const text = tone === 'light' ? 'text-white/65' : 'text-accent-600'
  const rule = tone === 'light' ? 'bg-white/35' : 'bg-accent-400'
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={`h-px w-7 ${rule}`} aria-hidden />
      <span className={`font-label text-[12px] uppercase tracking-[0.28em] ${text}`}>{children}</span>
    </div>
  )
}

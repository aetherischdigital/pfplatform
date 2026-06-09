import { Link } from 'react-router-dom'
import { BRAND } from '../config/brand'

type Props = {
  size?: 'sm' | 'md' | 'lg'
  to?: string
  variant?: 'dark' | 'light'
  /** When true, always render the compact shortName regardless of breakpoint.
   *  Use this in narrow containers (e.g. the authenticated sidebar) where the
   *  full BRAND.name would wrap. */
  compact?: boolean
}

const sizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
}

export default function Wordmark({
  size = 'md',
  to = '/',
  variant = 'dark',
  compact = false,
}: Props) {
  const color = variant === 'light' ? 'text-white' : 'text-surface-900'
  const accent = variant === 'light' ? 'text-accent-400' : 'text-accent-600'
  const ring = variant === 'light' ? 'border-white/45' : 'border-accent-400'
  const markFg = variant === 'light' ? 'text-white' : 'text-surface-900'
  return (
    <Link to={to} className={`group inline-flex items-center gap-2.5 ${color}`}>
      <span
        className={`grid h-8 w-8 place-items-center rounded-full border ${ring} transition-colors group-hover:border-accent-500`}
        aria-hidden
      >
        <span className={`font-label text-[13px] leading-none ${markFg}`}>P</span>
      </span>
      <span className={`font-display font-semibold tracking-tight ${sizes[size]}`}>
        {compact ? (
          <span>{BRAND.shortName}</span>
        ) : (
          <>
            <span className="hidden sm:inline">{BRAND.name}</span>
            <span className="sm:hidden">{BRAND.shortName}</span>
          </>
        )}
        <span className={`ml-0.5 ${accent}`}>.</span>
      </span>
    </Link>
  )
}

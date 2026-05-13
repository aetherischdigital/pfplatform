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
  const accent = variant === 'light' ? 'text-accent-400' : 'text-accent-500'
  const markBg = variant === 'light' ? 'bg-white' : 'bg-surface-900'
  const markFg = variant === 'light' ? 'text-surface-900' : 'text-accent-500'
  return (
    <Link to={to} className={`group inline-flex items-center gap-2 ${color}`}>
      <span
        className={`grid h-7 w-7 place-items-center rounded-md ${markBg}`}
        aria-hidden
      >
        <span className={`font-display font-extrabold text-[9px] leading-none tracking-tighter ${markFg}`}>
          PFP
        </span>
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

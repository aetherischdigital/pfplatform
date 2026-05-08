type Props = { className?: string }

const ACCENT = 'var(--color-accent-500)'
const SURFACE_DEEP = 'var(--color-surface-900)'
const GRID = 'var(--color-surface-200)'

export default function EquityChart({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 400 180"
      className={className}
      role="img"
      aria-label="Equity growth chart"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.28" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 45, 90, 135].map((y) => (
        <line key={y} x1="0" x2="400" y1={y + 10} y2={y + 10} stroke={GRID} strokeWidth="1" strokeDasharray="3 4" />
      ))}

      <path
        d="M 0,140 C 40,135 60,128 90,118 C 130,104 160,92 200,76 C 240,60 280,48 320,32 C 350,22 380,14 400,10 L 400,180 L 0,180 Z"
        fill="url(#equityFill)"
      />
      <path
        d="M 0,140 C 40,135 60,128 90,118 C 130,104 160,92 200,76 C 240,60 280,48 320,32 C 350,22 380,14 400,10"
        fill="none"
        stroke={ACCENT}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <line x1="240" y1="60" x2="240" y2="170" stroke={SURFACE_DEEP} strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      <circle cx="240" cy="60" r="4" fill={SURFACE_DEEP} />
      <circle cx="240" cy="60" r="8" fill={SURFACE_DEEP} opacity="0.15" />
    </svg>
  )
}

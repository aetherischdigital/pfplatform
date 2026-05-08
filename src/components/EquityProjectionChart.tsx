import type { EquityPoint } from '../lib/equity'

type Props = {
  points: EquityPoint[]
  className?: string
}

const W = 600
const H = 240
const PAD_L = 12
const PAD_R = 12
const PAD_T = 12
const PAD_B = 28

const ACCENT = 'var(--color-accent-500)'
const ACCENT_FAINT_FILL = 'rgb(184 148 90 / 0.18)'
const SURFACE_LINE = 'var(--color-surface-500)'
const BALANCE_FILL = 'var(--color-surface-200)'
const GRID = 'var(--color-surface-200)'
const LABEL = 'var(--color-surface-400)'

export default function EquityProjectionChart({ points, className = '' }: Props) {
  if (points.length === 0) {
    return <div className={`grid place-items-center text-sm text-surface-400 ${className}`}>—</div>
  }

  const maxMonth = points[points.length - 1].month
  const maxValue = points.reduce((m, p) => Math.max(m, p.homeValue), 0)

  const xScale = (m: number) => PAD_L + ((W - PAD_L - PAD_R) * m) / maxMonth
  const yScale = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - v / maxValue)

  const homeLine = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.month).toFixed(1)},${yScale(p.homeValue).toFixed(1)}`)
    .join(' ')
  const balanceLine = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.month).toFixed(1)},${yScale(p.balance).toFixed(1)}`)
    .join(' ')

  const homeArea = `${homeLine} L ${xScale(maxMonth).toFixed(1)},${(H - PAD_B).toFixed(1)} L ${PAD_L},${(H - PAD_B).toFixed(1)} Z`
  const balanceArea = `${balanceLine} L ${xScale(maxMonth).toFixed(1)},${(H - PAD_B).toFixed(1)} L ${PAD_L},${(H - PAD_B).toFixed(1)} Z`

  const totalYears = Math.ceil(maxMonth / 12)
  const tickStep = totalYears <= 10 ? 2 : 5
  const yearTicks: number[] = []
  for (let y = tickStep; y <= totalYears; y += tickStep) yearTicks.push(y)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Projected home equity over time"
    >
      {yearTicks.map((y) => {
        const x = xScale(y * 12)
        return (
          <g key={y}>
            <line
              x1={x}
              x2={x}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke={GRID}
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <text
              x={x}
              y={H - PAD_B + 16}
              textAnchor="middle"
              fontSize="11"
              fill={LABEL}
              fontFamily="var(--font-mono)"
            >
              +{y}y
            </text>
          </g>
        )
      })}

      {/* Home value area (the cap — full plot height) */}
      <path d={homeArea} fill={ACCENT_FAINT_FILL} />

      {/* Balance area (the debt — shrinks over time) */}
      <path d={balanceArea} fill={BALANCE_FILL} />

      {/* Boundary lines */}
      <path d={homeLine} fill="none" stroke={SURFACE_LINE} strokeWidth="1.5" strokeLinecap="round" />
      <path d={balanceLine} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

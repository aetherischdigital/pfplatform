import { useMemo, useRef, useState } from 'react'
import type { EquityPoint } from '../lib/equity'
import { formatUSD } from '../lib/mortgage'

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
const LABEL = 'var(--color-surface-500)'

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function projectedDateLabel(monthOffset: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + monthOffset)
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

export default function EquityProjectionChart({ points, className = '' }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const maxMonth = points.length > 0 ? points[points.length - 1].month : 0
  // Use max of both series so an underwater loan (balance > homeValue) doesn't
  // render the balance area above the chart top.
  const maxValue = useMemo(
    () => points.reduce((m, p) => Math.max(m, p.homeValue, p.balance), 0),
    [points],
  )

  if (points.length === 0) {
    return <div className={`grid place-items-center text-sm text-surface-500 ${className}`}>—</div>
  }

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

  // Map pointer x to the nearest data point. SVG uses preserveAspectRatio="none"
  // so we scale the client-coords back into the viewBox space ourselves.
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0) return
    const viewboxX = ((e.clientX - rect.left) / rect.width) * W
    if (viewboxX < PAD_L || viewboxX > W - PAD_R) {
      setHoverIndex(null)
      return
    }
    const month = ((viewboxX - PAD_L) / (W - PAD_L - PAD_R)) * maxMonth
    const idx = Math.max(0, Math.min(points.length - 1, Math.round(month)))
    setHoverIndex(idx)
  }
  const onPointerLeave = () => setHoverIndex(null)

  const hovered = hoverIndex !== null ? points[hoverIndex] : null
  const tooltipPad = 8
  const tooltipW = 152
  const tooltipH = 64
  let tooltipX = 0
  let tooltipY = PAD_T
  if (hovered) {
    const rawX = xScale(hovered.month)
    tooltipX = Math.max(PAD_L, Math.min(W - PAD_R - tooltipW, rawX - tooltipW / 2))
    tooltipY = Math.max(PAD_T, yScale(hovered.equity) - tooltipH - tooltipPad)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={`cursor-crosshair ${className}`}
      role="img"
      aria-label="Projected home equity over time"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
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

      {hovered && (
        <g pointerEvents="none">
          <line
            x1={xScale(hovered.month)}
            x2={xScale(hovered.month)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="var(--color-surface-900)"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeDasharray="2 3"
          />
          <circle
            cx={xScale(hovered.month)}
            cy={yScale(hovered.homeValue)}
            r="3.5"
            fill="var(--color-surface-50)"
            stroke={SURFACE_LINE}
            strokeWidth="1.5"
          />
          <circle
            cx={xScale(hovered.month)}
            cy={yScale(hovered.balance)}
            r="3.5"
            fill="var(--color-surface-50)"
            stroke={ACCENT}
            strokeWidth="1.5"
          />
          <g transform={`translate(${tooltipX} ${tooltipY})`}>
            <rect
              width={tooltipW}
              height={tooltipH}
              rx="6"
              fill="var(--color-surface-900)"
              opacity="0.95"
            />
            <text
              x={10}
              y={16}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="var(--color-surface-400)"
              letterSpacing="0.5"
            >
              {projectedDateLabel(hovered.month).toUpperCase()}
            </text>
            <text x={10} y={34} fontSize="13" fontWeight="600" fill="var(--color-accent-200)">
              Equity {formatUSD(hovered.equity)}
            </text>
            <text x={10} y={52} fontSize="11" fill="var(--color-surface-300)">
              Balance {formatUSD(hovered.balance)}
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}

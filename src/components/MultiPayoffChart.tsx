import { useRef, useState } from 'react'
import type { SimulationPoint } from '../lib/mortgage'
import { formatUSD, payoffDate } from '../lib/mortgage'

export type ChartSeries = {
  key: string
  label: string
  /** CSS color value — use a theme var so dark mode comes along for free. */
  color: string
  history: SimulationPoint[]
  /** Months to payoff (Infinity if it doesn't amortize). */
  months: number
}

type Props = {
  series: ChartSeries[]
  className?: string
}

const W = 600
const H = 280
const PAD_L = 12
const PAD_R = 12
const PAD_T = 16
const PAD_B = 28

const GRID = 'var(--color-surface-200)'
const MUTED = 'var(--color-surface-300)'
const LABEL = 'var(--color-surface-500)'

export default function MultiPayoffChart({ series, className = '' }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // Use the longest-running scenario for the x-axis so every line fits.
  const maxMonths = Math.max(
    ...series.map((s) => (Number.isFinite(s.months) ? s.months : 360)),
    1,
  )
  const maxBalance = Math.max(
    ...series.map((s) => s.history[0]?.balance ?? 0),
    1,
  )

  if (maxBalance === 0) {
    return <div className={`grid place-items-center text-sm text-surface-500 ${className}`}>—</div>
  }

  const xScale = (m: number) => PAD_L + ((W - PAD_L - PAD_R) * m) / maxMonths
  const yScale = (b: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - b / maxBalance)

  const yearTicks = computeYearTicks(maxMonths)

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
    const month = ((viewboxX - PAD_L) / (W - PAD_L - PAD_R)) * maxMonths
    setHoverIndex(Math.max(0, Math.min(maxMonths, Math.round(month))))
  }
  const onPointerLeave = () => setHoverIndex(null)

  const tooltipW = 200
  const lineH = 16
  const tooltipH = 22 + lineH * series.length
  let tooltipX = 0
  let tooltipY = PAD_T
  if (hoverIndex !== null) {
    const rawX = xScale(hoverIndex)
    tooltipX = Math.max(PAD_L, Math.min(W - PAD_R - tooltipW, rawX - tooltipW / 2))
    tooltipY = PAD_T
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={`cursor-crosshair ${className}`}
      role="img"
      aria-label="Loan balance over time across payoff scenarios"
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
              {y}y
            </text>
          </g>
        )
      })}

      <line
        x1={PAD_L}
        x2={W - PAD_R}
        y1={H - PAD_B}
        y2={H - PAD_B}
        stroke={MUTED}
        strokeWidth="1"
      />

      {series.map((s) => (
        <path
          key={s.key}
          d={pathFor(s.history, xScale, yScale)}
          fill="none"
          stroke={s.color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}

      {hoverIndex !== null && (
        <g pointerEvents="none">
          <line
            x1={xScale(hoverIndex)}
            x2={xScale(hoverIndex)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="var(--color-surface-900)"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeDasharray="2 3"
          />
          {series.map((s) => {
            const bal = balanceAtMonth(s.history, hoverIndex)
            if (bal === null) return null
            return (
              <circle
                key={`${s.key}-dot`}
                cx={xScale(hoverIndex)}
                cy={yScale(bal)}
                r="3.5"
                fill="var(--color-surface-50)"
                stroke={s.color}
                strokeWidth="1.5"
              />
            )
          })}
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
              {payoffDate(hoverIndex).toUpperCase()}
            </text>
            {series.map((s, i) => {
              const bal = balanceAtMonth(s.history, hoverIndex)
              return (
                <g key={`${s.key}-tt`} transform={`translate(10 ${30 + i * lineH})`}>
                  <rect width="8" height="8" y="-7" rx="1" fill={s.color} />
                  <text
                    x={14}
                    fontSize="11"
                    fill="var(--color-surface-300)"
                  >
                    {s.label}
                  </text>
                  <text
                    x={tooltipW - 20}
                    fontSize="11"
                    textAnchor="end"
                    fill="var(--color-surface-100)"
                    fontFamily="var(--font-mono)"
                  >
                    {bal === null ? '—' : formatUSD(bal)}
                  </text>
                </g>
              )
            })}
          </g>
        </g>
      )}
    </svg>
  )
}

function pathFor(
  history: SimulationPoint[],
  xScale: (m: number) => number,
  yScale: (b: number) => number,
): string {
  if (history.length === 0) return ''
  return history
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${xScale(p.month).toFixed(2)},${yScale(p.balance).toFixed(2)}`,
    )
    .join(' ')
}

function balanceAtMonth(history: SimulationPoint[], month: number): number | null {
  if (history.length === 0) return null
  for (let i = 0; i < history.length; i++) {
    if (history[i].month >= month) return history[i].balance
  }
  return 0
}

function computeYearTicks(maxMonths: number): number[] {
  const totalYears = Math.ceil(maxMonths / 12)
  const step = totalYears <= 10 ? 2 : 5
  const ticks: number[] = []
  for (let y = step; y <= totalYears; y += step) ticks.push(y)
  return ticks
}

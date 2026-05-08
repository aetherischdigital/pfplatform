import type { Simulation, SimulationPoint } from '../lib/mortgage'

type Props = {
  baseline: Simulation
  scenario: Simulation
  className?: string
}

const W = 600
const H = 280
const PAD_L = 12
const PAD_R = 12
const PAD_T = 16
const PAD_B = 28

const ACCENT = 'var(--color-accent-500)'
const ACCENT_FAINT = 'var(--color-accent-100)'
const SURFACE_DEEP = 'var(--color-surface-900)'
const GRID = 'var(--color-surface-200)'
const MUTED = 'var(--color-surface-300)'
const LABEL = 'var(--color-surface-400)'

export default function PayoffChart({ baseline, scenario, className = '' }: Props) {
  const maxMonths = Number.isFinite(baseline.months) ? baseline.months : 360
  const maxBalance = baseline.history[0]?.balance ?? 0

  if (maxMonths === 0 || maxBalance === 0) {
    return <div className={`grid place-items-center text-sm text-surface-400 ${className}`}>—</div>
  }

  const xScale = (m: number) => PAD_L + ((W - PAD_L - PAD_R) * m) / maxMonths
  const yScale = (b: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - b / maxBalance)

  const baselinePath = pathFor(baseline.history, xScale, yScale)
  const scenarioPath = pathFor(scenario.history, xScale, yScale)

  const yearTicks = computeYearTicks(maxMonths)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Loan balance over time, baseline vs. with extra principal"
    >
      {yearTicks.map((y) => {
        const x = xScale(y * 12)
        return (
          <g key={y}>
            <line x1={x} x2={x} y1={PAD_T} y2={H - PAD_B} stroke={GRID} strokeWidth="1" strokeDasharray="3 5" />
            <text x={x} y={H - PAD_B + 16} textAnchor="middle" fontSize="11" fill={LABEL} fontFamily="var(--font-mono)">
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

      {Number.isFinite(scenario.months) && (
        <path
          d={`${scenarioPath} L ${xScale(scenario.months)},${H - PAD_B} L ${PAD_L},${H - PAD_B} Z`}
          fill={ACCENT_FAINT}
          opacity="0.6"
        />
      )}

      <path d={baselinePath} fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" />
      {Number.isFinite(scenario.months) && (
        <path d={scenarioPath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
      )}

      {Number.isFinite(scenario.months) && (
        <PayoffMarker
          x={xScale(scenario.months)}
          y={H - PAD_B}
          color={ACCENT}
          label="Your payoff"
          align="end"
        />
      )}
      {Number.isFinite(baseline.months) && (
        <PayoffMarker
          x={xScale(baseline.months)}
          y={H - PAD_B}
          color={SURFACE_DEEP}
          label="Baseline"
          align={
            Number.isFinite(scenario.months) && (baseline.months - scenario.months) < 18 ? 'start' : 'end'
          }
        />
      )}
    </svg>
  )
}

function PayoffMarker({
  x,
  y,
  color,
  label,
  align,
}: {
  x: number
  y: number
  color: string
  label: string
  align: 'start' | 'end'
}) {
  const labelX = align === 'end' ? x - 6 : x + 6
  return (
    <g>
      <circle cx={x} cy={y} r="4" fill={color} />
      <circle cx={x} cy={y} r="9" fill={color} opacity="0.18" />
      <text
        x={labelX}
        y={y - 10}
        textAnchor={align === 'end' ? 'end' : 'start'}
        fontSize="11"
        fontWeight="500"
        fill={color}
      >
        {label}
      </text>
    </g>
  )
}

function pathFor(
  history: SimulationPoint[],
  xScale: (m: number) => number,
  yScale: (b: number) => number,
): string {
  if (history.length === 0) return ''
  return history
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.month).toFixed(2)},${yScale(p.balance).toFixed(2)}`)
    .join(' ')
}

function computeYearTicks(maxMonths: number): number[] {
  const totalYears = Math.ceil(maxMonths / 12)
  const step = totalYears <= 10 ? 2 : totalYears <= 20 ? 5 : 5
  const ticks: number[] = []
  for (let y = step; y <= totalYears; y += step) ticks.push(y)
  return ticks
}

import { useEffect, useRef, useState } from 'react'
import { Save, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  fetchNetWorthSnapshots,
  saveTodaysSnapshot,
  type NetWorthSnapshot,
} from '../../lib/netWorthSnapshots'
import { formatUSD } from '../../lib/mortgage'
import { Button } from '../ui/Button'

type Props = {
  totalAssets: number
  totalLiabilities: number
}

export default function NetWorthHistory({ totalAssets, totalLiabilities }: Props) {
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchNetWorthSnapshots()
      .then((data) => {
        if (!cancelled) setSnapshots(data)
      })
      .catch(() => {
        // Silent: an empty snapshot list isn't surfaced as an error, but we
        // also don't want a half-broken card screaming if Supabase blips.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      await saveTodaysSnapshot({ totalAssets, totalLiabilities })
      const fresh = await fetchNetWorthSnapshots()
      setSnapshots(fresh)
      setStatus({ kind: 'ok', message: "Snapshot saved for today." })
    } catch (err) {
      setStatus({
        kind: 'err',
        message: err instanceof Error ? err.message : 'Save failed.',
      })
    } finally {
      setSaving(false)
    }
  }

  // Auto-dismiss the success/error message after a beat.
  useEffect(() => {
    if (!status) return
    const t = setTimeout(() => setStatus(null), 3500)
    return () => clearTimeout(t)
  }, [status])

  const latest = snapshots[snapshots.length - 1] ?? null
  const oldest = snapshots[0] ?? null
  const delta = latest && oldest ? latest.netWorth - oldest.netWorth : 0
  const hasHistory = snapshots.length >= 2

  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-surface-900">
            Net worth over time
          </h2>
          <p className="mt-1 text-sm text-surface-500">
            {hasHistory
              ? `${snapshots.length} snapshots since ${formatShortDate(oldest!.snapshotDate)}.`
              : 'Save a snapshot today, then again next month, to start tracking your trajectory.'}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSave}
          disabled={saving || loading}
        >
          <Save size={14} />
          {saving ? 'Saving…' : "Save today's snapshot"}
        </Button>
      </header>

      {status && (
        <div
          role={status.kind === 'err' ? 'alert' : 'status'}
          className={`mt-4 flex items-start gap-2 rounded-md px-3 py-2 text-sm animate-enter ${
            status.kind === 'err'
              ? 'border border-danger-200 bg-danger-50 text-danger-700'
              : 'border border-success-200 bg-success-50 text-success-700'
          }`}
        >
          {status.kind === 'err' ? (
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {hasHistory && (
        <>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <Stat
              label="First snapshot"
              value={formatUSD(oldest!.netWorth)}
              sub={formatShortDate(oldest!.snapshotDate)}
            />
            <Stat
              label="Latest snapshot"
              value={formatUSD(latest!.netWorth)}
              sub={formatShortDate(latest!.snapshotDate)}
              accent
            />
            <Stat
              label="Change"
              value={`${delta >= 0 ? '+' : '−'}${formatUSD(Math.abs(delta))}`}
              sub={delta >= 0 ? 'Up' : 'Down'}
              tone={delta >= 0 ? 'good' : 'bad'}
            />
          </div>

          <div className="mt-5 h-40">
            <Sparkline snapshots={snapshots} />
          </div>
        </>
      )}

      {!hasHistory && !loading && snapshots.length === 1 && (
        <div className="mt-4 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-600">
          One snapshot on file ({formatUSD(latest!.netWorth)} on{' '}
          {formatShortDate(latest!.snapshotDate)}). Come back monthly and save another to see your trajectory.
        </div>
      )}
    </section>
  )
}

function Stat({
  label,
  value,
  sub,
  accent,
  tone,
}: {
  label: string
  value: string
  sub: string
  accent?: boolean
  tone?: 'good' | 'bad'
}) {
  const color =
    tone === 'good'
      ? 'text-success-700'
      : tone === 'bad'
        ? 'text-danger-700'
        : accent
          ? 'text-accent-600'
          : 'text-surface-900'
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-surface-500">
        {label}
      </div>
      <div className={`mt-1 font-display text-xl font-semibold tracking-tight ${color}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-surface-500">{sub}</div>
    </div>
  )
}

function Sparkline({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const W = 600
  const H = 160
  const PAD_L = 8
  const PAD_R = 8
  const PAD_T = 14
  const PAD_B = 22

  const values = snapshots.map((s) => s.netWorth)
  const min = Math.min(...values)
  const max = Math.max(...values)
  // Padding the range a bit so the line doesn't kiss the edges when flat.
  const range = max - min || Math.max(1, Math.abs(max))
  const yScale = (v: number) =>
    PAD_T + (H - PAD_T - PAD_B) * (1 - (v - min + range * 0.1) / (range * 1.2))
  const xScale = (i: number) =>
    PAD_L + ((W - PAD_L - PAD_R) * i) / Math.max(1, snapshots.length - 1)

  const path = snapshots
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)},${yScale(s.netWorth).toFixed(1)}`)
    .join(' ')

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0) return
    const viewboxX = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.round(((viewboxX - PAD_L) / (W - PAD_L - PAD_R)) * (snapshots.length - 1))
    setHoverIdx(Math.max(0, Math.min(snapshots.length - 1, i)))
  }
  const onPointerLeave = () => setHoverIdx(null)

  const hovered = hoverIdx !== null ? snapshots[hoverIdx] : null

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-full w-full cursor-crosshair"
      role="img"
      aria-label="Net worth over time sparkline"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <line
        x1={PAD_L}
        x2={W - PAD_R}
        y1={H - PAD_B}
        y2={H - PAD_B}
        stroke="var(--color-surface-200)"
        strokeWidth="1"
      />
      <path
        d={`${path} L ${xScale(snapshots.length - 1)},${H - PAD_B} L ${PAD_L},${H - PAD_B} Z`}
        fill="var(--color-accent-100)"
        opacity="0.6"
      />
      <path d={path} fill="none" stroke="var(--color-accent-500)" strokeWidth="2" strokeLinecap="round" />
      {snapshots.map((s, i) => (
        <circle
          key={s.id}
          cx={xScale(i)}
          cy={yScale(s.netWorth)}
          r="3"
          fill="var(--color-surface-50)"
          stroke="var(--color-accent-500)"
          strokeWidth="1.5"
        />
      ))}
      {hovered && (
        <g pointerEvents="none">
          <line
            x1={xScale(hoverIdx!)}
            x2={xScale(hoverIdx!)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="var(--color-surface-900)"
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="2 3"
          />
          <g transform={`translate(${Math.min(xScale(hoverIdx!), W - 160)} ${PAD_T})`}>
            <rect width="150" height="44" rx="6" fill="var(--color-surface-900)" opacity="0.95" />
            <text x={10} y={18} fontSize="11" fill="var(--color-surface-300)">
              {formatShortDate(hovered.snapshotDate)}
            </text>
            <text x={10} y={35} fontSize="13" fontWeight="600" fill="var(--color-accent-200)">
              {formatUSD(hovered.netWorth)}
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

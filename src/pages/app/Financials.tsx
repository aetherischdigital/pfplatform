import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import {
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  deleteMortgage,
  deletePfsRecord,
  fetchPfs,
  totals,
  type Pfs,
  type PfsRecordKind,
} from '../../lib/pfs'
import { formatUSD } from '../../lib/mortgage'
import { Button } from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PfsRecordModal, { type ExistingRecord } from '../../components/pfs/PfsRecordModal'
import MortgageModal from '../../components/pfs/MortgageModal'

type PendingDelete =
  | { kind: 'record'; id: string; label: string }
  | { kind: 'mortgage'; id: string; propertyLabel: string }

export default function Financials() {
  const [pfs, setPfs] = useState<Pfs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recordModal, setRecordModal] = useState<{ kind: PfsRecordKind; existing?: ExistingRecord } | null>(
    null,
  )
  const [mortgageModalOpen, setMortgageModalOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    return fetchPfs()
      .then((data) => {
        setPfs(data)
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load financial data.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchPfs()
      .then((data) => {
        if (!cancelled) setPfs(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load financial data.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onDeleteRecord = (id: string, label: string) =>
    setPendingDelete({ kind: 'record', id, label })

  const onDeleteMortgage = () => {
    if (!pfs?.mortgage) return
    setPendingDelete({
      kind: 'mortgage',
      id: pfs.mortgage.id,
      propertyLabel: pfs.mortgage.propertyLabel,
    })
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setError(null)
    try {
      if (pendingDelete.kind === 'record') {
        await deletePfsRecord(pendingDelete.id)
      } else {
        await deleteMortgage(pendingDelete.id)
      }
      await load()
      setPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <SkeletonState />
  if (error && !pfs) return <ErrorState message={error} onRetry={load} />
  if (!pfs) return null

  const t = totals(pfs)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
          Personal Financial Statement
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          The living document — assets, liabilities, income, and expenses.
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Headline label="Net worth" value={formatUSD(t.netWorth)} accent />
        <Headline label="Total assets" value={formatUSD(t.totalAssets)} />
        <Headline label="Total liabilities" value={`−${formatUSD(t.totalLiabilities)}`} />
      </div>

      <Section
        title="Assets"
        total={t.totalAssets}
        totalSign="+"
        onAdd={() => setRecordModal({ kind: 'asset' })}
      >
        {pfs.assets.length === 0 ? (
          <EmptyRow kind="asset" />
        ) : (
          <ItemList
            rows={pfs.assets.map((a) => ({
              id: a.id,
              label: a.label,
              sub: ASSET_CATEGORY_LABELS[a.category],
              value: formatUSD(a.value),
              onEdit: () => setRecordModal({ kind: 'asset', existing: { kind: 'asset', ...a } }),
              onDelete: () => onDeleteRecord(a.id, a.label),
            }))}
          />
        )}
      </Section>

      <Section
        title="Liabilities"
        total={t.totalLiabilities}
        totalSign="−"
        onAdd={() => setRecordModal({ kind: 'liability' })}
      >
        {pfs.liabilities.length === 0 ? (
          <EmptyRow kind="liability" />
        ) : (
          <ItemList
            rows={pfs.liabilities.map((l) => ({
              id: l.id,
              label: l.label,
              sub: l.rate
                ? `${LIABILITY_CATEGORY_LABELS[l.category]} • ${l.rate}% APR`
                : LIABILITY_CATEGORY_LABELS[l.category],
              value: formatUSD(l.balance),
              onEdit: () =>
                setRecordModal({ kind: 'liability', existing: { kind: 'liability', ...l } }),
              onDelete: () => onDeleteRecord(l.id, l.label),
            }))}
          />
        )}
      </Section>

      <Section
        title="Mortgage details"
        subtitle={
          pfs.mortgage
            ? `${pfs.mortgage.propertyLabel} • ${pfs.mortgage.ratePct}% • ${pfs.mortgage.termMonthsRemaining} mo left`
            : 'Used by payoff projections and equity math.'
        }
        rightAction={
          pfs.mortgage ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setMortgageModalOpen(true)}>
                <Pencil size={14} /> Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={onDeleteMortgage}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setMortgageModalOpen(true)}>
              <Plus size={14} /> Add
            </Button>
          )
        }
      >
        {pfs.mortgage ? (
          <dl className="divide-y divide-surface-200">
            <DetailRow label="Balance" value={formatUSD(pfs.mortgage.balance)} />
            <DetailRow label="Monthly P&I" value={formatUSD(pfs.mortgage.monthlyPayment)} />
            <DetailRow
              label="Extra principal / mo"
              value={formatUSD(pfs.mortgage.extraPrincipal)}
            />
            <DetailRow
              label="Starting home value"
              value={formatUSD(pfs.mortgage.startingHomeValue)}
            />
          </dl>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-surface-500">
            No mortgage on file. Add one to enable payoff projections.
          </div>
        )}
      </Section>

      <Section
        title="Income"
        total={t.monthlyIncome}
        totalSign="+"
        totalSuffix=" / mo"
        onAdd={() => setRecordModal({ kind: 'income' })}
      >
        {pfs.income.length === 0 ? (
          <EmptyRow kind="income" />
        ) : (
          <ItemList
            rows={pfs.income.map((i) => ({
              id: i.id,
              label: i.label,
              sub: 'Monthly',
              value: formatUSD(i.monthly),
              onEdit: () =>
                setRecordModal({ kind: 'income', existing: { kind: 'income', ...i } }),
              onDelete: () => onDeleteRecord(i.id, i.label),
            }))}
          />
        )}
      </Section>

      <Section
        title="Expenses"
        total={t.monthlyExpenses}
        totalSign="−"
        totalSuffix=" / mo"
        onAdd={() => setRecordModal({ kind: 'expense' })}
      >
        {pfs.expenses.length === 0 ? (
          <EmptyRow kind="expense" />
        ) : (
          <ItemList
            rows={pfs.expenses.map((e) => ({
              id: e.id,
              label: e.label,
              sub: EXPENSE_CATEGORY_LABELS[e.category],
              value: formatUSD(e.monthly),
              onEdit: () =>
                setRecordModal({ kind: 'expense', existing: { kind: 'expense', ...e } }),
              onDelete: () => onDeleteRecord(e.id, e.label),
            }))}
          />
        )}
      </Section>

      {recordModal && (
        <PfsRecordModal
          open
          onClose={() => setRecordModal(null)}
          onSaved={load}
          kind={recordModal.kind}
          existing={recordModal.existing}
        />
      )}

      {mortgageModalOpen && (
        <MortgageModal
          open
          onClose={() => setMortgageModalOpen(false)}
          onSaved={load}
          existing={pfs.mortgage}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'mortgage' ? 'Delete mortgage?' : 'Delete entry?'}
        message={
          pendingDelete?.kind === 'mortgage'
            ? `Delete the mortgage for "${pendingDelete.propertyLabel}"? Payoff projections and equity math will go with it.`
            : pendingDelete?.kind === 'record'
              ? `Delete "${pendingDelete.label}"? This can't be undone.`
              : ''
        }
        confirmLabel="Delete"
        variant="danger"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? null : setPendingDelete(null))}
      />
    </div>
  )
}

function Headline({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wider text-surface-400">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-semibold tracking-tight ${
          accent ? 'text-accent-600' : 'text-surface-900'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

type Row = {
  id: string
  label: string
  sub: string
  value: string
  onEdit: () => void
  onDelete: () => void
}

function Section({
  title,
  subtitle,
  total,
  totalSign,
  totalSuffix = '',
  onAdd,
  rightAction,
  children,
}: {
  title: string
  subtitle?: string
  total?: number
  totalSign?: '+' | '−'
  totalSuffix?: string
  onAdd?: () => void
  rightAction?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
      <header className="flex items-center justify-between gap-4 border-b border-surface-200 px-6 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-surface-900">{title}</h2>
          {total != null && totalSign ? (
            <div className="mt-0.5 font-mono text-sm text-surface-500">
              {totalSign}
              {formatUSD(total)}
              {totalSuffix}
            </div>
          ) : subtitle ? (
            <div className="mt-0.5 text-sm text-surface-500">{subtitle}</div>
          ) : null}
        </div>
        {rightAction ??
          (onAdd && (
            <Button variant="secondary" size="sm" onClick={onAdd}>
              <Plus size={14} /> Add
            </Button>
          ))}
      </header>
      {children}
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <dt className="text-sm text-surface-500">{label}</dt>
      <dd className="font-mono text-sm font-medium text-surface-900">{value}</dd>
    </div>
  )
}

function ItemList({ rows }: { rows: Row[] }) {
  return (
    <ul className="divide-y divide-surface-200">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-surface-900">{r.label}</div>
            <div className="mt-0.5 text-xs text-surface-500">{r.sub}</div>
          </div>
          <div className="font-mono text-sm font-medium text-surface-900">{r.value}</div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={r.onEdit}
              className="rounded-md p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
              aria-label={`Edit ${r.label}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={r.onDelete}
              className="rounded-md p-2 text-surface-400 hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${r.label}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyRow({ kind }: { kind: PfsRecordKind }) {
  const labels: Record<PfsRecordKind, string> = {
    asset: 'No assets yet. Add a home, retirement account, or cash.',
    liability: 'No liabilities yet. Add your mortgage, loans, or credit cards.',
    income: 'No income sources yet.',
    expense: 'No expenses yet.',
  }
  return <div className="px-6 py-8 text-center text-sm text-surface-500">{labels[kind]}</div>
}

function SkeletonState() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
          Personal Financial Statement
        </h1>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-100" />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-100" />
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle size={24} className="mx-auto text-red-600" />
      <p className="mt-3 text-sm text-red-700">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </div>
  )
}

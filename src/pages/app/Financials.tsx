import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, AlertTriangle, Home, Star } from 'lucide-react'
import {
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  deleteMortgage,
  deletePfsRecord,
  fetchPfs,
  setPrimaryMortgage,
  totals,
  totalMonthlyHousingOutflow,
  type Mortgage,
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [pfs, setPfs] = useState<Pfs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recordModal, setRecordModal] = useState<{ kind: PfsRecordKind; existing?: ExistingRecord } | null>(
    null,
  )
  // Auto-open the mortgage modal when arriving via the onboarding "Add mortgage"
  // CTA (?add=mortgage). Strip the param immediately so refresh doesn't reopen.
  const [mortgageModal, setMortgageModal] = useState<{ existing: Mortgage | null } | null>(
    searchParams.get('add') === 'mortgage' ? { existing: null } : null,
  )
  useEffect(() => {
    if (searchParams.get('add') === 'mortgage') {
      const next = new URLSearchParams(searchParams)
      next.delete('add')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])
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

  const onDeleteMortgage = (mortgage: Mortgage) => {
    setPendingDelete({
      kind: 'mortgage',
      id: mortgage.id,
      propertyLabel: mortgage.propertyLabel,
    })
  }

  const onSetPrimary = async (id: string) => {
    setError(null)
    try {
      await setPrimaryMortgage(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set primary property.')
    }
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
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
          Personal Financial Statement
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          The living document — assets, liabilities, income, and expenses.
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
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
        title="Properties"
        subtitle={
          pfs.mortgages.length === 0
            ? 'Used by payoff projections and equity math.'
            : `${pfs.mortgages.length} ${pfs.mortgages.length === 1 ? 'property' : 'properties'} • primary drives the dashboard.`
        }
        rightAction={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMortgageModal({ existing: null })}
          >
            <Plus size={14} /> {pfs.mortgages.length === 0 ? 'Add' : 'Add another'}
          </Button>
        }
      >
        {pfs.mortgages.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-surface-500">
            No properties on file. Add one to enable payoff projections.
          </div>
        ) : (
          <ul className="divide-y divide-surface-200">
            {pfs.mortgages.map((m) => (
              <PropertyRow
                key={m.id}
                mortgage={m}
                onEdit={() => setMortgageModal({ existing: m })}
                onDelete={() => onDeleteMortgage(m)}
                onSetPrimary={() => onSetPrimary(m.id)}
              />
            ))}
          </ul>
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
              sub: INCOME_CATEGORY_LABELS[i.category],
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

      {mortgageModal && (
        <MortgageModal
          open
          onClose={() => setMortgageModal(null)}
          onSaved={load}
          existing={mortgageModal.existing}
          defaultIsPrimary={pfs.mortgages.length === 0}
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
      <div className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</div>
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

function PropertyRow({
  mortgage: m,
  onEdit,
  onDelete,
  onSetPrimary,
}: {
  mortgage: Mortgage
  onEdit: () => void
  onDelete: () => void
  onSetPrimary: () => void
}) {
  const piti = totalMonthlyHousingOutflow(m)
  return (
    <li className="px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Home size={14} className="text-surface-400" />
            <span className="font-medium text-surface-900">{m.propertyLabel}</span>
            {m.isPrimary && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700">
                <Star size={10} fill="currentColor" /> Primary
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-surface-500">
            {m.ratePct}% • {m.termMonthsRemaining} mo left • {m.pctOwnership}% ownership
            {m.dateAcquired && ` • acquired ${formatAcquired(m.dateAcquired)}`}
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-1">
          {!m.isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              className="rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
              aria-label={`Make ${m.propertyLabel} primary`}
              title="Make primary"
            >
              <Star size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
            aria-label={`Edit ${m.propertyLabel}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-2 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
            aria-label={`Delete ${m.propertyLabel}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <PropertyDetail label="Balance" value={formatUSD(m.balance)} />
        <PropertyDetail label="P&amp;I / mo" value={formatUSD(m.monthlyPayment)} />
        <PropertyDetail label="Home value" value={formatUSD(m.startingHomeValue)} />
        <PropertyDetail label="Extra principal" value={formatUSD(m.extraPrincipal)} />
      </dl>

      {(piti?.hasPiti || m.originalCost != null) && (
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-surface-100 pt-3 text-xs text-surface-600 sm:grid-cols-4">
          {m.propertyTaxAnnual != null && (
            <PropertyDetail
              label="Property tax / yr"
              value={formatUSD(m.propertyTaxAnnual)}
              muted
            />
          )}
          {m.homeownersInsuranceAnnual != null && (
            <PropertyDetail
              label="Insurance / yr"
              value={formatUSD(m.homeownersInsuranceAnnual)}
              muted
            />
          )}
          {m.hoaMonthly != null && m.hoaMonthly > 0 && (
            <PropertyDetail label="HOA / mo" value={formatUSD(m.hoaMonthly)} muted />
          )}
          {m.originalCost != null && (
            <PropertyDetail
              label="Original cost"
              value={formatUSD(m.originalCost)}
              muted
            />
          )}
          {piti?.hasPiti && (
            <PropertyDetail
              label="True PITI / mo"
              value={formatUSD(piti.total)}
              muted
              highlight
            />
          )}
        </dl>
      )}
    </li>
  )
}

function PropertyDetail({
  label,
  value,
  muted,
  highlight,
}: {
  label: string
  value: string
  muted?: boolean
  highlight?: boolean
}) {
  return (
    <div>
      <dt className={`text-xs ${muted ? 'text-surface-500' : 'text-surface-500'}`}>{label}</dt>
      <dd
        className={`mt-0.5 font-mono text-sm font-medium ${highlight ? 'text-accent-700' : 'text-surface-900'}`}
      >
        {value}
      </dd>
    </div>
  )
}

function formatAcquired(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
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
              className="rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
              aria-label={`Edit ${r.label}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={r.onDelete}
              className="rounded-md p-2 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
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
    <div className="rounded-2xl border border-danger-200 bg-danger-50 p-8 text-center">
      <AlertTriangle size={24} className="mx-auto text-danger-600" />
      <p className="mt-3 text-sm text-danger-700">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </div>
  )
}

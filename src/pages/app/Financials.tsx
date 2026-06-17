import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Home,
  Briefcase,
  ShieldAlert,
} from 'lucide-react'
import {
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  LIVING_EXPENSE_CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
  deletePfsRecord,
  deleteLivingExpense,
  fetchPfs,
  totals,
  type Totals,
  type Pfs,
  type PfsRecordKind,
  type LivingExpense,
} from '../../lib/pfs'
import {
  deleteBusinessVenture,
  fetchBusinessVentures,
  type BusinessVenture,
} from '../../lib/businessVentures'
import {
  deleteContingentLiability,
  fetchContingentLiabilities,
  CONTINGENT_TYPE_LABELS,
  type ContingentLiability,
} from '../../lib/contingentLiabilities'
import { formatUSD } from '../../lib/mortgage'
import { Button } from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PfsRecordModal, { type ExistingRecord } from '../../components/pfs/PfsRecordModal'
import LivingExpenseModal from '../../components/pfs/LivingExpenseModal'
import BusinessVentureModal from '../../components/pfs/BusinessVentureModal'
import ContingentLiabilityModal from '../../components/pfs/ContingentLiabilityModal'

type PendingDelete =
  | { kind: 'record'; id: string; label: string }
  | { kind: 'living_expense'; id: string; label: string }
  | { kind: 'business_venture'; id: string; label: string }
  | { kind: 'contingent_liability'; id: string; label: string }

export default function Financials() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [pfs, setPfs] = useState<Pfs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recordModal, setRecordModal] = useState<{ kind: PfsRecordKind; existing?: ExistingRecord } | null>(
    null,
  )
  // Legacy deep-link (?add=mortgage) now routes to the dedicated add-property page.
  useEffect(() => {
    if (searchParams.get('add') === 'mortgage') {
      navigate('/app/properties/new', { replace: true })
    }
  }, [searchParams, navigate])
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [livingModal, setLivingModal] = useState<{ existing: LivingExpense | null } | null>(null)

  const [businessVentures, setBusinessVentures] = useState<BusinessVenture[]>([])
  const [bvModal, setBvModal] = useState<{ existing: BusinessVenture | null } | null>(null)

  const [contingents, setContingents] = useState<ContingentLiability[]>([])
  const [clModal, setClModal] = useState<{ existing: ContingentLiability | null } | null>(null)

  const load = useCallback(() => {
    return Promise.all([fetchPfs(), fetchBusinessVentures(), fetchContingentLiabilities()])
      .then(([pfsData, bv, cl]) => {
        setPfs(pfsData)
        setBusinessVentures(bv)
        setContingents(cl)
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
    Promise.all([fetchPfs(), fetchBusinessVentures(), fetchContingentLiabilities()])
      .then(([pfsData, bv, cl]) => {
        if (cancelled) return
        setPfs(pfsData)
        setBusinessVentures(bv)
        setContingents(cl)
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

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setError(null)
    try {
      switch (pendingDelete.kind) {
        case 'record':
          await deletePfsRecord(pendingDelete.id)
          break
        case 'living_expense':
          await deleteLivingExpense(pendingDelete.id)
          break
        case 'business_venture':
          await deleteBusinessVenture(pendingDelete.id)
          break
        case 'contingent_liability':
          await deleteContingentLiability(pendingDelete.id)
          break
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
        <div className="flex items-center gap-3">
          <span className="h-px w-7 bg-accent-400" />
          <span className="font-label text-[12px] uppercase tracking-[0.28em] text-accent-600">
            Personal financial statement
          </span>
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-surface-900">
          Where you stand
        </h1>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <StatementHero t={t} />

      <GroupHeader title="Balance sheet" />

      <div className="grid items-start gap-4 lg:grid-cols-2">
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

      <div className="space-y-4">
      <Section
        title="Liabilities (secured debt)"
        total={t.ledgerLiabilities}
        totalSign="−"
        rightAction={
          <div className="flex gap-2">
            {pfs.properties.length === 0 && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/app/properties/new')}>
                <Plus size={14} /> Property
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRecordModal({ kind: 'liability' })}
            >
              <Plus size={14} /> Add
            </Button>
          </div>
        }
      >
        {pfs.liabilities.length === 0 ? (
          <EmptyRow kind="liability" />
        ) : (
          <ItemList
            rows={pfs.liabilities.map((l) => ({
              id: l.id,
              label: l.label,
              sub: debtSub(LIABILITY_CATEGORY_LABELS[l.category], l.rate, l.monthlyPayment),
              value: formatUSD(l.balance),
              onEdit: () =>
                setRecordModal({ kind: 'liability', existing: { kind: 'liability', ...l } }),
              onDelete: () => onDeleteRecord(l.id, l.label),
            }))}
          />
        )}
      </Section>

      <Section
        title="Expenses (unsecured debt)"
        total={t.unsecuredDebt}
        totalSign="−"
        onAdd={() => setRecordModal({ kind: 'expense' })}
      >
        {pfs.expenses.length === 0 ? (
          <EmptyRow kind="expense" />
        ) : (
          <ItemList
            rows={pfs.expenses.map((e) => ({
              id: e.id,
              label: e.label,
              sub: debtSub(EXPENSE_CATEGORY_LABELS[e.category], e.rate, e.monthlyPayment),
              value: formatUSD(e.balance),
              onEdit: () =>
                setRecordModal({ kind: 'expense', existing: { kind: 'expense', ...e } }),
              onDelete: () => onDeleteRecord(e.id, e.label),
            }))}
          />
        )}
      </Section>
      </div>
      </div>

      <Section
        title="Properties"
        total={pfs.properties.reduce((s, p) => s + p.marketValue, 0)}
        totalSign="+"
        rightAction={
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/properties/new')}>
            <Plus size={14} /> Add
          </Button>
        }
      >
        {pfs.properties.length === 0 ? (
          <div className="px-5 py-5 text-sm text-surface-500">
            No properties on file.{' '}
            <button
              type="button"
              onClick={() => navigate('/app/properties/new')}
              className="font-medium text-accent-600 underline-offset-2 hover:underline"
            >
              Add one →
            </button>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-surface-200">
              {pfs.properties.map((p) => {
                const equity = p.marketValue - (p.mortgage?.balance ?? 0)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/app/properties/${p.id}/edit`)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-inset"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Home size={14} className="flex-shrink-0 text-surface-400" />
                        <span className="truncate text-sm font-medium text-surface-900">
                          {p.label}
                        </span>
                        <span className="flex-shrink-0 rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">
                          {PROPERTY_TYPE_LABELS[p.propertyType]}
                        </span>
                      </span>
                      <span className="flex flex-shrink-0 items-baseline gap-5 font-mono text-sm tabular-nums">
                        <span className="text-surface-500">{formatUSD(p.marketValue)}</span>
                        <span className="text-surface-900">
                          {formatUSD(equity)}
                          <span className="ml-1 text-xs text-surface-400">eq</span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="border-t border-surface-200 px-5 py-2.5 text-right">
              <button
                type="button"
                onClick={() => navigate('/app/properties')}
                className="text-xs font-medium text-accent-600 underline-offset-2 hover:underline"
              >
                Manage properties →
              </button>
            </div>
          </>
        )}
      </Section>

      <GroupHeader title="Cash flow" />

      <div className="grid items-start gap-4 lg:grid-cols-2">
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
        title="Household spending"
        subtitle="Everyday living costs. Skip your mortgage, property taxes, and home insurance — those come from Properties so they're never counted twice."
        total={t.monthlyLivingExpenses}
        totalSign="−"
        totalSuffix=" / mo"
        onAdd={() => setLivingModal({ existing: null })}
      >
        {pfs.livingExpenses.length === 0 ? (
          <div className="px-6 py-5 text-center text-sm text-surface-500">
            No spending entered yet. Add rent (if you rent), utilities, phone, internet, groceries,
            auto/health insurance, etc. Skip your mortgage and home costs — those come from
            Properties. These feed your cash flow waterfall on the dashboard.
          </div>
        ) : (
          <ItemList
            rows={pfs.livingExpenses.map((e) => ({
              id: e.id,
              label: e.label,
              sub: LIVING_EXPENSE_CATEGORY_LABELS[e.category],
              value: `${formatUSD(e.monthlyAmount)} / mo`,
              onEdit: () => setLivingModal({ existing: e }),
              onDelete: () =>
                setPendingDelete({ kind: 'living_expense', id: e.id, label: e.label }),
            }))}
          />
        )}
      </Section>
      </div>

      <GroupHeader title="Other holdings & obligations" />

      <div className="grid items-start gap-4 lg:grid-cols-2">
      <Section
        title="Business ventures"
        subtitle={
          businessVentures.length === 0
            ? 'Businesses you hold a principal or partner interest in.'
            : `${businessVentures.length} ${businessVentures.length === 1 ? 'venture' : 'ventures'} on file.`
        }
        rightAction={
          <Button variant="secondary" size="sm" onClick={() => setBvModal({ existing: null })}>
            <Plus size={14} /> Add
          </Button>
        }
      >
        {businessVentures.length === 0 ? (
          <div className="px-6 py-5 text-center text-sm text-surface-500">
            None on file. Skip if you don&rsquo;t hold any business interests.
          </div>
        ) : (
          <ul className="divide-y divide-surface-200">
            {businessVentures.map((bv) => (
              <BusinessVentureRow
                key={bv.id}
                venture={bv}
                onEdit={() => setBvModal({ existing: bv })}
                onDelete={() =>
                  setPendingDelete({ kind: 'business_venture', id: bv.id, label: bv.name })
                }
              />
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Contingent liabilities"
        subtitle={
          contingents.length === 0
            ? 'Debts not yet on your balance sheet — guarantor obligations, leases, lawsuits, contested tax liens.'
            : `${contingents.length} potential ${contingents.length === 1 ? 'obligation' : 'obligations'} tracked.`
        }
        rightAction={
          <Button variant="secondary" size="sm" onClick={() => setClModal({ existing: null })}>
            <Plus size={14} /> Add
          </Button>
        }
      >
        {contingents.length === 0 ? (
          <div className="px-6 py-5 text-center text-sm text-surface-500">
            None tracked. Add if you&rsquo;ve guaranteed someone else&rsquo;s debt or have other off-balance obligations.
          </div>
        ) : (
          <ul className="divide-y divide-surface-200">
            {contingents.map((c) => (
              <ContingentRow
                key={c.id}
                contingent={c}
                onEdit={() => setClModal({ existing: c })}
                onDelete={() =>
                  setPendingDelete({
                    kind: 'contingent_liability',
                    id: c.id,
                    label: CONTINGENT_TYPE_LABELS[c.type],
                  })
                }
              />
            ))}
          </ul>
        )}
      </Section>
      </div>

      {recordModal && (
        <PfsRecordModal
          open
          onClose={() => setRecordModal(null)}
          onSaved={load}
          kind={recordModal.kind}
          existing={recordModal.existing}
        />
      )}

      {livingModal && (
        <LivingExpenseModal
          open
          onClose={() => setLivingModal(null)}
          onSaved={load}
          existing={livingModal.existing}
        />
      )}

      {bvModal && (
        <BusinessVentureModal
          open
          onClose={() => setBvModal(null)}
          onSaved={load}
          existing={bvModal.existing}
        />
      )}

      {clModal && (
        <ContingentLiabilityModal
          open
          onClose={() => setClModal(null)}
          onSaved={load}
          existing={clModal.existing}
        />
      )}

      {livingModal && (
        <LivingExpenseModal
          open
          onClose={() => setLivingModal(null)}
          onSaved={load}
          existing={livingModal.existing}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete entry?"
        message={
          pendingDelete?.kind === 'record' || pendingDelete?.kind === 'living_expense'
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

function GroupHeader({ title }: { title: string }) {
  return (
    <div className="-mb-3 flex items-center gap-3 pt-2">
      <span className="font-label text-[12px] uppercase tracking-[0.24em] text-accent-600">
        {title}
      </span>
      <span className="h-px flex-1 bg-surface-200" />
    </div>
  )
}

function StatementHero({ t }: { t: Totals }) {
  const asOf = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const signed = (n: number) => (n < 0 ? `−${formatUSD(Math.abs(n))}` : formatUSD(n))
  return (
    <div className="overflow-hidden rounded-xl border border-surface-800 bg-surface-900 text-surface-50 shadow-card-lg">
      <div className="grid gap-px bg-surface-800 lg:grid-cols-2">
        {/* Net worth */}
        <div className="bg-surface-900 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-label text-[11px] uppercase tracking-[0.28em] text-accent-200">
              Net worth
            </span>
            <span className="font-mono text-[11px] text-surface-400">as of {asOf}</span>
          </div>
          <div className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {formatUSD(t.netWorth)}
          </div>
          <dl className="mt-6 space-y-2.5 text-sm">
            <LedgerLine label="Total assets" value={`+${formatUSD(t.totalAssets)}`} />
            <LedgerLine
              label="Total liabilities"
              value={t.totalLiabilities > 0 ? `−${formatUSD(t.totalLiabilities)}` : formatUSD(0)}
            />
            <div className="border-t border-surface-700 pt-2.5">
              <LedgerLine label="Net worth" value={formatUSD(t.netWorth)} strong />
            </div>
          </dl>
        </div>
        {/* Monthly cash flow */}
        <div className="bg-surface-900 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-label text-[11px] uppercase tracking-[0.28em] text-accent-200">
              Monthly cash flow
            </span>
            <span className="font-mono text-[11px] text-surface-400">/ mo</span>
          </div>
          <div
            className={`mt-3 font-display text-4xl font-semibold tracking-tight ${
              t.monthlyLeftover < 0 ? 'text-danger-200' : ''
            }`}
          >
            {signed(t.monthlyLeftover)}
          </div>
          <div className="mt-1 text-xs text-surface-400">left over to direct at principal</div>
          <dl className="mt-5 space-y-2.5 text-sm">
            <LedgerLine label="Income" value={`+${formatUSD(t.monthlyIncome)}`} />
            <LedgerLine
              label="Fixed expenses"
              value={t.monthlyDebtPayments > 0 ? `−${formatUSD(t.monthlyDebtPayments)}` : formatUSD(0)}
            />
            <LedgerLine
              label="Household spending"
              value={
                t.monthlyLivingExpenses > 0 ? `−${formatUSD(t.monthlyLivingExpenses)}` : formatUSD(0)
              }
            />
            <div className="border-t border-surface-700 pt-2.5">
              <LedgerLine label="Left over" value={signed(t.monthlyLeftover)} strong />
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

function LedgerLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? 'font-medium text-surface-50' : 'text-surface-300'}>{label}</dt>
      <dd
        className={`font-mono tabular-nums ${
          strong ? 'text-base font-semibold text-surface-50' : 'text-surface-100'
        }`}
      >
        {value}
      </dd>
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
    <section className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-card">
      <header className="flex items-start justify-between gap-4 border-b border-surface-200 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="font-label text-[12px] uppercase tracking-[0.2em] text-accent-600">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-surface-500">{subtitle}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          {total != null && totalSign && (
            <span className="font-mono text-sm tabular-nums text-surface-900">
              {total > 0 ? totalSign : ''}
              {formatUSD(total)}
              {totalSuffix}
            </span>
          )}
          {rightAction ??
            (onAdd && (
              <Button variant="secondary" size="sm" onClick={onAdd}>
                <Plus size={14} /> Add
              </Button>
            ))}
        </div>
      </header>
      {children}
    </section>
  )
}

function BusinessVentureRow({
  venture: bv,
  onEdit,
  onDelete,
}: {
  venture: BusinessVenture
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <li className="px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Briefcase size={14} className="text-surface-400" />
            <span className="font-medium text-surface-900">{bv.name}</span>
            {bv.pctOwnership != null && (
              <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-700">
                {bv.pctOwnership}% ownership
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-surface-500">
            {[bv.positionTitle, bv.lineOfBusiness, bv.yearsInBusiness ? `${bv.yearsInBusiness} yr` : null]
              .filter(Boolean)
              .join(' • ') || 'No additional details'}
          </div>
          {bv.address && <div className="mt-0.5 text-xs text-surface-500">{bv.address}</div>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          {bv.businessAssets != null && (
            <div className="text-right">
              <div className="text-xs text-surface-500">Total assets</div>
              <div className="font-mono text-sm font-medium text-surface-900">
                {formatUSD(bv.businessAssets)}
              </div>
            </div>
          )}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md p-2.5 text-surface-400 md:p-2 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
              aria-label={`Edit ${bv.name}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md p-2.5 text-surface-400 md:p-2 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
              aria-label={`Delete ${bv.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

function ContingentRow({
  contingent: c,
  onEdit,
  onDelete,
}: {
  contingent: ContingentLiability
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <li className="px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldAlert size={14} className="text-warning-700" />
            <span className="font-medium text-surface-900">
              {CONTINGENT_TYPE_LABELS[c.type]}
            </span>
            {c.estimatedAmount != null && (
              <span className="rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
                ~{formatUSD(c.estimatedAmount)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-surface-700">{c.description}</p>
        </div>
        <div className="flex flex-shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-2.5 text-surface-400 md:p-2 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
            aria-label="Edit contingent liability"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-2.5 text-surface-400 md:p-2 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
            aria-label="Delete contingent liability"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </li>
  )
}

function debtSub(
  category: string,
  rate: number | undefined,
  monthlyPayment: number | null,
): string {
  return [
    category,
    rate ? `${rate}% APR` : null,
    monthlyPayment != null ? `${formatUSD(monthlyPayment)}/mo` : null,
  ]
    .filter(Boolean)
    .join(' • ')
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
              className="rounded-md p-2.5 text-surface-400 md:p-2 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
              aria-label={`Edit ${r.label}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={r.onDelete}
              className="rounded-md p-2.5 text-surface-400 md:p-2 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
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
    asset: 'No assets yet. Add retirement, cash, or investments. Real estate lives in Properties below.',
    liability: 'No secured debts yet. Add auto loans or HELOCs. Mortgages live in Properties below.',
    income: 'No income sources yet.',
    expense: 'No unsecured debts yet. Add credit cards, student loans, alimony, etc.',
  }
  return <div className="px-6 py-5 text-center text-sm text-surface-500">{labels[kind]}</div>
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

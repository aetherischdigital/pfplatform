import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Star, Building2, AlertTriangle, Home } from 'lucide-react'
import {
  fetchPfs,
  deleteProperty,
  setPrimaryProperty,
  totalMonthlyHousingOutflow,
  PROPERTY_TYPE_LABELS,
  type Property,
  type Pfs,
} from '../../lib/pfs'
import { formatUSD } from '../../lib/mortgage'
import { Button } from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PropertyModal from '../../components/pfs/PropertyModal'

/** Monthly carrying cost (taxes + insurance + flood + HOA) — loan-independent. */
function carryMonthly(p: Property): number {
  return (
    (p.propertyTaxAnnual ?? 0) / 12 +
    (p.homeownersInsuranceAnnual ?? 0) / 12 +
    (p.floodInsuranceAnnual ?? 0) / 12 +
    (p.hoaMonthly ?? 0)
  )
}

/** True total monthly housing cost: P&I + PMI + carrying costs. */
function housingMonthly(p: Property): number {
  const m = p.mortgage
  return (m?.monthlyPayment ?? 0) + (m?.pmiMipMonthly ?? 0) + carryMonthly(p)
}

export default function Properties() {
  const [pfs, setPfs] = useState<Pfs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<{ existing: Property | null } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Property | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    return fetchPfs()
      .then((data) => {
        setPfs(data)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load properties.'))
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchPfs()
      .then((data) => {
        if (!cancelled) setPfs(data)
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Could not load properties.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onSetPrimary = async (id: string) => {
    setError(null)
    try {
      await setPrimaryProperty(id)
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
      await deleteProperty(pendingDelete.id)
      await load()
      setPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-9 w-48 rounded bg-surface-100" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-44 rounded-xl bg-surface-100" />
          <div className="h-44 rounded-xl bg-surface-100" />
        </div>
      </div>
    )
  }
  if (!pfs) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
        <span>{error ?? 'Could not load properties.'}</span>
        <button type="button" onClick={() => load()} className="ml-auto font-medium underline">
          Retry
        </button>
      </div>
    )
  }

  const properties = pfs.properties
  const totalValue = properties.reduce((s, p) => s + p.marketValue, 0)
  const totalEquity = properties.reduce((s, p) => s + (p.marketValue - (p.mortgage?.balance ?? 0)), 0)
  const totalHousing = properties.reduce((s, p) => s + housingMonthly(p), 0)

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
            Properties
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Every home at a glance — value, equity, and true monthly cost.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setModal({ existing: null })}>
          <Plus size={16} /> Add property
        </Button>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 px-6 py-16 text-center">
          <Building2 size={28} className="mx-auto text-surface-300" />
          <p className="mt-3 font-display text-lg font-semibold text-surface-900">
            No properties yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-surface-500">
            Add a home you own — with or without a mortgage — to track equity, payoff, and the true
            monthly cost of ownership.
          </p>
          <div className="mt-5">
            <Button variant="primary" size="md" onClick={() => setModal({ existing: null })}>
              <Plus size={16} /> Add your first property
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Headline label="Portfolio value" value={formatUSD(totalValue)} />
            <Headline label="Total equity" value={formatUSD(totalEquity)} accent />
            <Headline label="Monthly housing cost" value={`${formatUSD(totalHousing)} / mo`} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onEdit={() => setModal({ existing: p })}
                onDelete={() => setPendingDelete(p)}
                onSetPrimary={() => onSetPrimary(p.id)}
              />
            ))}
          </div>
        </>
      )}

      {modal && (
        <PropertyModal
          open
          onClose={() => setModal(null)}
          onSaved={load}
          existing={modal.existing}
          defaultType={pfs.primaryProperty ? 'other' : 'primary'}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete property?"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.label}"? Its mortgage, equity, and payoff projections go with it.`
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

function Headline({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 px-5 py-4">
      <div className="font-mono text-xs uppercase tracking-wider text-surface-500">{label}</div>
      <div
        className={`mt-1 font-display text-2xl font-semibold ${accent ? 'text-accent-700' : 'text-surface-900'}`}
      >
        {value}
      </div>
    </div>
  )
}

function PropertyCard({
  property: p,
  onEdit,
  onDelete,
  onSetPrimary,
}: {
  property: Property
  onEdit: () => void
  onDelete: () => void
  onSetPrimary: () => void
}) {
  const m = p.mortgage
  const isPrimary = p.propertyType === 'primary'
  const equity = p.marketValue - (m?.balance ?? 0)
  const piti = totalMonthlyHousingOutflow(m)
  const monthly = housingMonthly(p)
  const netCashFlow =
    p.propertyType === 'rental' && p.monthlyRent != null ? p.monthlyRent - monthly : null

  return (
    <div className="flex flex-col rounded-xl border border-surface-200 bg-surface-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Home size={15} className="text-surface-400" />
            <span className="truncate font-display text-lg font-semibold text-surface-900">
              {p.label}
            </span>
            <span className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">
              {PROPERTY_TYPE_LABELS[p.propertyType]}
            </span>
            {isPrimary && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700">
                <Star size={10} fill="currentColor" /> Primary
              </span>
            )}
          </div>
          {p.address && <div className="mt-1 truncate text-xs text-surface-500">{p.address}</div>}
          <div className="mt-1 text-xs text-surface-500">
            {m ? `${m.ratePct}% • ${m.termMonthsRemaining} mo left` : 'Owned outright'}
            {p.pctOwnership < 100 && ` • ${p.pctOwnership}% owned`}
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-1">
          {!isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              className="rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              aria-label={`Make ${p.label} primary`}
              title="Make primary"
            >
              <Star size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            aria-label={`Edit ${p.label}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-2 text-surface-400 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            aria-label={`Delete ${p.label}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Stat label="Value" value={formatUSD(p.marketValue)} />
        <Stat label="Equity" value={formatUSD(equity)} accent />
        {m ? (
          <>
            <Stat label="Balance" value={formatUSD(m.balance)} />
            <Stat label="P&I / mo" value={formatUSD(m.monthlyPayment)} />
          </>
        ) : (
          <Stat label="Mortgage" value="None" />
        )}
      </dl>

      <div className="mt-4 border-t border-surface-200 pt-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-surface-600">
          {p.propertyTaxAnnual != null && (
            <Stat label="Tax / yr" value={formatUSD(p.propertyTaxAnnual)} small />
          )}
          {p.homeownersInsuranceAnnual != null && (
            <Stat label="Insurance / yr" value={formatUSD(p.homeownersInsuranceAnnual)} small />
          )}
          {p.floodInsuranceAnnual != null && (
            <Stat label="Flood / yr" value={formatUSD(p.floodInsuranceAnnual)} small />
          )}
          {m?.pmiMipMonthly != null && (
            <Stat label="PMI / MIP / mo" value={formatUSD(m.pmiMipMonthly)} small />
          )}
          {p.hoaMonthly != null && p.hoaMonthly > 0 && (
            <Stat label="HOA / mo" value={formatUSD(p.hoaMonthly)} small />
          )}
        </dl>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-100 px-3 py-2">
          <span className="text-xs font-medium text-surface-600">
            {piti?.hasPiti || !m ? 'True monthly cost' : 'Monthly cost'}
          </span>
          <span className="font-display text-base font-semibold text-surface-900">
            {formatUSD(monthly)} <span className="text-xs font-normal text-surface-500">/ mo</span>
          </span>
        </div>

        {p.propertyType === 'rental' && p.monthlyRent != null && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-100 px-3 py-2">
            <span className="text-xs font-medium text-surface-600">
              Rent {formatUSD(p.monthlyRent)} → net cash flow
            </span>
            <span
              className={`font-display text-base font-semibold ${
                netCashFlow != null && netCashFlow < 0 ? 'text-danger-600' : 'text-accent-700'
              }`}
            >
              {netCashFlow != null ? formatUSD(netCashFlow) : '—'}
              <span className="text-xs font-normal text-surface-500"> / mo</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
  small,
}: {
  label: string
  value: string
  accent?: boolean
  small?: boolean
}) {
  return (
    <div>
      <dt className={`${small ? 'text-[11px]' : 'text-xs'} uppercase tracking-wide text-surface-400`}>
        {label}
      </dt>
      <dd
        className={`${small ? 'text-sm' : 'text-base'} font-medium ${
          accent ? 'text-accent-700' : 'text-surface-900'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

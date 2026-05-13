import { useEffect, useRef, useState } from 'react'
import { X, AlertTriangle, Mail, Calendar, Users, Star } from 'lucide-react'
import { useModalDismiss } from '../../lib/useModalDismiss'
import { fetchUserSummary, type AdminUserSummary } from '../../lib/admin'
import { formatUSD } from '../../lib/mortgage'
import {
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '../../lib/pfs'
import { CONTINGENT_TYPE_LABELS } from '../../lib/contingentLiabilities'

type Props = {
  userId: string | null
  onClose: () => void
}

export default function AdminUserSummaryModal({ userId, onClose }: Props) {
  if (!userId) return null
  // Keying on userId remounts the inner component when the admin switches users,
  // which keeps the fetch effect tied to a single user and avoids the
  // setState-in-effect anti-pattern.
  return <Inner key={userId} userId={userId} onClose={onClose} />
}

function Inner({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [summary, setSummary] = useState<AdminUserSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useModalDismiss(true, onClose, cardRef)

  useEffect(() => {
    let cancelled = false
    fetchUserSummary(userId)
      .then((s) => {
        if (!cancelled) setSummary(s)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load user summary.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-surface-900/60 px-4 py-10 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-summary-title"
        tabIndex={-1}
        className="relative w-full max-w-3xl rounded-2xl border border-surface-200 bg-white p-6 shadow-card-lg sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <h2 id="admin-summary-title" className="pr-8 font-display text-xl font-semibold text-surface-900">
          User detail
        </h2>
        <p className="mt-1 text-sm text-surface-500">
          Read-only snapshot of this user's PFS data. Edits go through the user.
        </p>

        {loading && (
          <div className="mt-6 rounded-lg border border-surface-200 bg-surface-50 px-4 py-8 text-center text-sm text-surface-500">
            Loading…
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
          >
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {summary && <SummaryBody summary={summary} />}
      </div>
    </div>
  )
}

function SummaryBody({ summary }: { summary: AdminUserSummary }) {
  const totalAssets =
    summary.assets.reduce((s, a) => s + a.value, 0) +
    summary.mortgages.reduce((s, m) => s + m.startingHomeValue, 0)
  const totalLiabilities =
    summary.liabilities.reduce((s, l) => s + l.balance, 0) +
    summary.mortgages.reduce((s, m) => s + m.balance, 0)
  const netWorth = totalAssets - totalLiabilities
  const monthlyIncome = summary.income.reduce((s, i) => s + i.monthly, 0)
  const monthlyExpenses = summary.expenses.reduce((s, e) => s + e.monthly, 0)
  const monthlyNet = monthlyIncome - monthlyExpenses

  return (
    <div className="mt-6 max-h-[70vh] space-y-6 overflow-y-auto pr-1">
      {/* Identity */}
      <section>
        <H>Identity</H>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={<Mail size={14} />} label="Email" value={summary.profile.email ?? '—'} />
          <Field
            label="Display name"
            value={summary.profile.displayName ?? '—'}
          />
          <Field
            label="Role"
            value={
              <span className="capitalize">
                {summary.profile.role}
                {summary.profile.role === 'admin' && ' ★'}
              </span>
            }
          />
          <Field
            label="Status"
            value={
              summary.profile.isActive ? (
                <span className="text-success-700">Active</span>
              ) : (
                <span className="text-surface-500">Inactive</span>
              )
            }
          />
          <Field
            icon={<Calendar size={14} />}
            label="Birthdate"
            value={formatBirthdate(summary.profile.birthdate)}
          />
          <Field
            icon={<Users size={14} />}
            label="Dependents"
            value={summary.profile.dependents !== null ? String(summary.profile.dependents) : '—'}
          />
          <Field label="Waitlist interest" value={
            summary.profile.waitlistInterest === 'none' ? '—' : summary.profile.waitlistInterest.toUpperCase()
          } />
          <Field label="Joined" value={formatDate(summary.profile.createdAt)} />
        </div>
        {(summary.profile.spouseName || summary.profile.spouseBirthdate || summary.profile.spouseOccupation) && (
          <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wider text-surface-500">
              Spouse / co-applicant
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 text-sm text-surface-700">
              <div>{summary.profile.spouseName ?? '—'}</div>
              <div>{formatBirthdate(summary.profile.spouseBirthdate)}</div>
              <div>{summary.profile.spouseOccupation ?? '—'}</div>
            </div>
          </div>
        )}
      </section>

      {/* Headline totals */}
      <section>
        <H>Headline</H>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total assets" value={formatUSD(totalAssets)} />
          <Stat label="Total liabilities" value={formatUSD(totalLiabilities)} />
          <Stat
            label="Net worth"
            value={formatUSD(netWorth)}
            tone={netWorth >= 0 ? 'good' : 'bad'}
          />
          <Stat
            label="Monthly net"
            value={`${monthlyNet >= 0 ? '+' : '−'}${formatUSD(Math.abs(monthlyNet))}`}
            tone={monthlyNet >= 0 ? 'good' : 'bad'}
          />
        </div>
      </section>

      {/* Properties */}
      {summary.mortgages.length > 0 && (
        <section>
          <H>Properties ({summary.mortgages.length})</H>
          <ul className="space-y-2">
            {summary.mortgages.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-surface-200 bg-white p-3 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium text-surface-900">
                    {m.propertyLabel}
                    {m.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700">
                        <Star size={10} /> Primary
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-surface-500">
                    {formatUSD(m.balance)} of {formatUSD(m.startingHomeValue)}
                  </div>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-surface-600 sm:grid-cols-3">
                  <div>Rate: {m.ratePct.toFixed(3)}%</div>
                  <div>Term left: {m.termMonthsRemaining} mo</div>
                  <div>P+I: {formatUSD(m.monthlyPayment)}/mo</div>
                  {m.propertyTaxAnnual !== null && (
                    <div>Tax: {formatUSD(m.propertyTaxAnnual)}/yr</div>
                  )}
                  {m.homeownersInsuranceAnnual !== null && (
                    <div>Ins: {formatUSD(m.homeownersInsuranceAnnual)}/yr</div>
                  )}
                  {m.hoaMonthly !== null && <div>HOA: {formatUSD(m.hoaMonthly)}/mo</div>}
                  {m.extraPrincipal > 0 && (
                    <div>Extra principal: {formatUSD(m.extraPrincipal)}/mo</div>
                  )}
                  {m.dateAcquired && <div>Acquired: {formatBirthdate(m.dateAcquired)}</div>}
                  {m.originalCost !== null && (
                    <div>Original cost: {formatUSD(m.originalCost)}</div>
                  )}
                  <div>Ownership: {m.pctOwnership}%</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecordSection
        title={`Other assets (${summary.assets.length})`}
        empty="No other assets recorded."
        rows={summary.assets.map((a) => ({
          id: a.id,
          label: a.label,
          sub: ASSET_CATEGORY_LABELS[a.category],
          value: formatUSD(a.value),
        }))}
      />

      <RecordSection
        title={`Other liabilities (${summary.liabilities.length})`}
        empty="No other liabilities recorded."
        rows={summary.liabilities.map((l) => ({
          id: l.id,
          label: l.label,
          sub: `${LIABILITY_CATEGORY_LABELS[l.category]}${
            l.rate !== undefined ? ` · ${l.rate}%` : ''
          }`,
          value: formatUSD(l.balance),
        }))}
      />

      <RecordSection
        title={`Income (${summary.income.length})`}
        empty="No income sources recorded."
        rows={summary.income.map((i) => ({
          id: i.id,
          label: i.label,
          sub: INCOME_CATEGORY_LABELS[i.category],
          value: `${formatUSD(i.monthly)}/mo`,
        }))}
      />

      <RecordSection
        title={`Expenses (${summary.expenses.length})`}
        empty="No expenses recorded."
        rows={summary.expenses.map((e) => ({
          id: e.id,
          label: e.label,
          sub: EXPENSE_CATEGORY_LABELS[e.category],
          value: `${formatUSD(e.monthly)}/mo`,
        }))}
      />

      {summary.businessVentures.length > 0 && (
        <section>
          <H>Business ventures ({summary.businessVentures.length})</H>
          <ul className="space-y-2">
            {summary.businessVentures.map((b) => (
              <li key={b.id} className="rounded-lg border border-surface-200 bg-white p-3 text-sm">
                <div className="font-medium text-surface-900">{b.name}</div>
                <div className="mt-1 text-xs text-surface-600 flex flex-wrap gap-x-3 gap-y-1">
                  {b.lineOfBusiness && <span>{b.lineOfBusiness}</span>}
                  {b.positionTitle && <span>· {b.positionTitle}</span>}
                  {b.pctOwnership !== null && <span>· {b.pctOwnership}% owned</span>}
                  {b.yearsInBusiness !== null && <span>· {b.yearsInBusiness} yrs</span>}
                  {b.businessAssets !== null && <span>· Assets: {formatUSD(b.businessAssets)}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.contingentLiabilities.length > 0 && (
        <section>
          <H>Contingent liabilities ({summary.contingentLiabilities.length})</H>
          <ul className="space-y-2">
            {summary.contingentLiabilities.map((c) => (
              <li key={c.id} className="rounded-lg border border-surface-200 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-medium text-surface-900">
                    {CONTINGENT_TYPE_LABELS[c.type]}
                  </div>
                  {c.estimatedAmount !== null && (
                    <div className="text-xs text-surface-500">
                      Est. {formatUSD(c.estimatedAmount)}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-surface-600">{c.description}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.snapshots.length > 0 && (
        <section>
          <H>Net worth snapshots ({summary.snapshots.length})</H>
          <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 text-xs text-surface-600">
            {summary.snapshots.map((s) => (
              <div key={s.snapshotDate} className="flex justify-between py-0.5">
                <span>{formatBirthdate(s.snapshotDate)}</span>
                <span className="font-medium text-surface-900">{formatUSD(s.netWorth)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-surface-500">
      {children}
    </h3>
  )
}

function Field({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-surface-500">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-sm text-surface-900">{value}</div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'good' | 'bad'
}) {
  const color =
    tone === 'good' ? 'text-success-700' : tone === 'bad' ? 'text-danger-700' : 'text-surface-900'
  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</div>
      <div className={`mt-1 font-display text-lg font-semibold tracking-tight ${color}`}>
        {value}
      </div>
    </div>
  )
}

function RecordSection({
  title,
  rows,
  empty,
}: {
  title: string
  rows: Array<{ id: string; label: string; sub: string; value: string }>
  empty: string
}) {
  if (rows.length === 0) {
    return (
      <section>
        <H>{title}</H>
        <p className="text-xs text-surface-500">{empty}</p>
      </section>
    )
  }
  return (
    <section>
      <H>{title}</H>
      <ul className="divide-y divide-surface-200 rounded-lg border border-surface-200 bg-white">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate text-surface-900">{r.label}</div>
              <div className="text-xs text-surface-500">{r.sub}</div>
            </div>
            <div className="flex-shrink-0 font-medium text-surface-900">{r.value}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Render an ISO YYYY-MM-DD date as "Mon D, YYYY" without TZ drift. */
function formatBirthdate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

import { Plus, Pencil } from 'lucide-react'
import {
  MOCK_ASSETS,
  MOCK_LIABILITIES,
  MOCK_INCOME,
  MOCK_EXPENSES,
  totals,
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
} from '../../lib/mockData'
import { formatUSD } from '../../lib/mortgage'
import { Button } from '../../components/ui/Button'

export default function Financials() {
  const t = totals()

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

      <div className="grid gap-4 sm:grid-cols-3">
        <Headline label="Net worth" value={formatUSD(t.netWorth)} accent />
        <Headline label="Total assets" value={formatUSD(t.totalAssets)} />
        <Headline label="Total liabilities" value={`−${formatUSD(t.totalLiabilities)}`} />
      </div>

      <Section title="Assets" total={t.totalAssets} totalSign="+">
        <ItemList
          rows={MOCK_ASSETS.map((a) => ({
            id: a.id,
            label: a.label,
            sub: ASSET_CATEGORY_LABELS[a.category],
            value: formatUSD(a.value),
          }))}
        />
      </Section>

      <Section title="Liabilities" total={t.totalLiabilities} totalSign="−">
        <ItemList
          rows={MOCK_LIABILITIES.map((l) => ({
            id: l.id,
            label: l.label,
            sub: l.rate
              ? `${LIABILITY_CATEGORY_LABELS[l.category]} • ${l.rate}% APR`
              : LIABILITY_CATEGORY_LABELS[l.category],
            value: formatUSD(l.balance),
          }))}
        />
      </Section>

      <Section title="Income" total={t.monthlyIncome} totalSign="+" totalSuffix=" / mo">
        <ItemList
          rows={MOCK_INCOME.map((i) => ({
            id: i.id,
            label: i.label,
            sub: 'Monthly',
            value: formatUSD(i.monthly),
          }))}
        />
      </Section>

      <Section title="Expenses" total={t.monthlyExpenses} totalSign="−" totalSuffix=" / mo">
        <ItemList
          rows={MOCK_EXPENSES.map((e) => ({
            id: e.id,
            label: e.label,
            sub: capitalize(e.category),
            value: formatUSD(e.monthly),
          }))}
        />
      </Section>
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

type Row = { id: string; label: string; sub: string; value: string }

function Section({
  title,
  total,
  totalSign,
  totalSuffix = '',
  children,
}: {
  title: string
  total: number
  totalSign: '+' | '−'
  totalSuffix?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
      <header className="flex items-center justify-between border-b border-surface-200 px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-surface-900">{title}</h2>
          <div className="mt-0.5 font-mono text-sm text-surface-500">
            {totalSign}
            {formatUSD(total)}
            {totalSuffix}
          </div>
        </div>
        <Button variant="secondary" size="sm" disabled>
          <Plus size={14} /> Add
        </Button>
      </header>
      {children}
    </section>
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
          <button
            type="button"
            disabled
            className="rounded-md p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Edit (not yet wired)"
            aria-label={`Edit ${r.label}`}
          >
            <Pencil size={14} />
          </button>
        </li>
      ))}
    </ul>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

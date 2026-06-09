import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import {
  amortizationSchedule,
  formatUSD,
  monthlyPaymentForLoan,
} from '../../lib/mortgage'
import { Button } from '../ui/Button'
import { NumberField } from '../ui/NumberField'
import PitiLine from './PitiLine'

export type AmortizationCalculatorDefaults = {
  balance?: number
  rate?: number
  termYears?: number
  propertyTaxAnnual?: number | null
  homeownersInsuranceAnnual?: number | null
  hoaMonthly?: number | null
}

type Props = {
  defaults?: AmortizationCalculatorDefaults
}

export default function AmortizationCalculator({ defaults }: Props) {
  const [balance, setBalance] = useState(defaults?.balance ?? 312_500)
  const [rate, setRate] = useState(defaults?.rate ?? 6.5)
  const [termYears, setTermYears] = useState(defaults?.termYears ?? 30)
  const [showAll, setShowAll] = useState(false)

  const termMonths = Math.max(1, Math.round(termYears * 12))

  const schedule = useMemo(
    () => amortizationSchedule(balance, rate, termMonths),
    [balance, rate, termMonths],
  )

  const payment = useMemo(
    () => monthlyPaymentForLoan(balance, rate, termMonths),
    [balance, rate, termMonths],
  )

  const totals = useMemo(() => {
    let interest = 0
    let principal = 0
    for (const row of schedule) {
      interest += row.interest
      principal += row.principal
    }
    return { interest, principal, totalPaid: interest + principal }
  }, [schedule])

  // Default view: first 12 + last 12 rows with a gap. Full term on demand.
  const visibleRows = useMemo(() => {
    if (showAll || schedule.length <= 26) {
      return { head: schedule, tail: [], gap: 0 }
    }
    return {
      head: schedule.slice(0, 12),
      tail: schedule.slice(-12),
      gap: schedule.length - 24,
    }
  }, [schedule, showAll])

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
          <h2 className="font-display text-lg font-semibold text-surface-900">Your loan</h2>
          <p className="mt-1 text-sm text-surface-500">
            We&rsquo;ll build the full schedule from these.
          </p>
          <div className="mt-6 space-y-5">
            <NumberField
              label="Loan amount"
              prefix="$"
              value={balance}
              onChange={setBalance}
              step={1000}
            />
            <NumberField
              label="Interest rate"
              suffix="%"
              value={rate}
              onChange={setRate}
              step={0.125}
            />
            <NumberField
              label="Term"
              suffix="years"
              value={termYears}
              onChange={setTermYears}
              step={1}
              min={1}
            />
          </div>

          <div className="mt-7 rounded-lg border border-surface-200 bg-surface-50 p-4">
            <Row label="Monthly payment" value={formatUSD(payment)} accent />
            <Row label="Total interest" value={formatUSD(totals.interest)} />
            <Row label="Total paid" value={formatUSD(totals.totalPaid)} />
            <PitiLine
              monthlyPayment={payment}
              propertyTaxAnnual={defaults?.propertyTaxAnnual ?? null}
              homeownersInsuranceAnnual={defaults?.homeownersInsuranceAnnual ?? null}
              hoaMonthly={defaults?.hoaMonthly ?? null}
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 px-6 py-4">
            <div>
              <h3 className="font-display text-base font-semibold text-surface-900">
                Payment schedule
              </h3>
              <p className="mt-0.5 text-xs text-surface-500">
                {schedule.length} payments. Interest tapers as the balance falls.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => downloadCsv(schedule)}
              disabled={schedule.length === 0}
            >
              <Download size={14} className="mr-1.5" />
              Export CSV
            </Button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-surface-50 text-left font-mono text-[11px] uppercase tracking-wider text-surface-500">
                <tr>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3 text-right">Payment</th>
                  <th className="px-4 py-3 text-right">Principal</th>
                  <th className="px-4 py-3 text-right">Interest</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 font-mono text-surface-900">
                {visibleRows.head.map((row) => (
                  <ScheduleRow key={row.month} row={row} />
                ))}
                {visibleRows.gap > 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center text-xs text-surface-500">
                      <button
                        type="button"
                        onClick={() => setShowAll(true)}
                        className="font-sans text-accent-600 underline-offset-2 hover:underline"
                      >
                        Show {visibleRows.gap} more months
                      </button>
                    </td>
                  </tr>
                )}
                {visibleRows.tail.map((row) => (
                  <ScheduleRow key={row.month} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleRow({ row }: { row: ReturnType<typeof amortizationSchedule>[number] }) {
  return (
    <tr className="hover:bg-surface-50">
      <td className="px-4 py-2 font-sans text-surface-700">{row.month}</td>
      <td className="px-4 py-2 text-right">{formatUSD(row.payment)}</td>
      <td className="px-4 py-2 text-right text-accent-700">{formatUSD(row.principal)}</td>
      <td className="px-4 py-2 text-right text-surface-500">{formatUSD(row.interest)}</td>
      <td className="px-4 py-2 text-right">{formatUSD(row.balance)}</td>
    </tr>
  )
}

function Row({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between py-1 text-sm">
      <span className="text-surface-500">{label}</span>
      <span
        className={`font-mono font-medium ${accent ? 'text-accent-700' : 'text-surface-900'}`}
      >
        {value}
      </span>
    </div>
  )
}

function downloadCsv(schedule: ReturnType<typeof amortizationSchedule>) {
  const header = 'Month,Payment,Principal,Interest,Balance\n'
  const body = schedule
    .map(
      (r) =>
        `${r.month},${r.payment.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.balance.toFixed(2)}`,
    )
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `amortization-schedule.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


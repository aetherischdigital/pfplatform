import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import PayoffChart from '../../components/PayoffChart'
import {
  compareScenarios,
  monthlyPaymentForLoan,
  formatUSD,
  formatYearsMonths,
  payoffDate,
} from '../../lib/mortgage'

export default function Calculator() {
  const [balance, setBalance] = useState(312_500)
  const [rate, setRate] = useState(6.5)
  const [termYears, setTermYears] = useState(28)
  const [extra, setExtra] = useState(200)

  const monthlyPayment = useMemo(
    () => monthlyPaymentForLoan(balance, rate, termYears * 12),
    [balance, rate, termYears],
  )

  const result = useMemo(
    () => compareScenarios(balance, rate, monthlyPayment, extra),
    [balance, rate, monthlyPayment, extra],
  )

  const { baseline, scenario, monthsSaved, interestSaved } = result

  return (
    <>
      <section className="bg-gradient-to-b from-surface-50 to-white">
        <Container className="py-16 text-center sm:py-20">
          <p className="font-mono text-xs uppercase tracking-wider text-accent-600">Free tool</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-5xl font-semibold tracking-tight text-surface-900 sm:text-6xl">
            See your payoff date in under 60 seconds.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-surface-500">
            Enter your loan, add a few extra dollars a month, and see the years and dollars you'd save.
            No signup required.
          </p>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="pb-16">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Inputs */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
                <h2 className="font-display text-lg font-semibold text-surface-900">Your loan</h2>
                <p className="mt-1 text-sm text-surface-500">
                  We'll compute your monthly payment from these.
                </p>
                <div className="mt-6 space-y-5">
                  <NumberField
                    label="Mortgage balance"
                    prefix="$"
                    value={balance}
                    onChange={setBalance}
                    step={1000}
                    min={0}
                  />
                  <NumberField
                    label="Interest rate"
                    suffix="%"
                    value={rate}
                    onChange={setRate}
                    step={0.125}
                    min={0}
                  />
                  <NumberField
                    label="Term remaining"
                    suffix="years"
                    value={termYears}
                    onChange={setTermYears}
                    step={1}
                    min={1}
                  />
                </div>

                <div className="mt-7 border-t border-surface-200 pt-6">
                  <h3 className="font-display text-base font-semibold text-surface-900">
                    Pay extra
                  </h3>
                  <p className="mt-1 text-sm text-surface-500">
                    The lever that changes everything.
                  </p>
                  <div className="mt-5">
                    <NumberField
                      label="Extra principal each month"
                      prefix="$"
                      value={extra}
                      onChange={setExtra}
                      step={25}
                      min={0}
                    />
                  </div>
                </div>

                <div className="mt-7 rounded-lg border border-surface-200 bg-surface-50 p-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-surface-500">Scheduled monthly payment</span>
                    <span className="font-mono font-medium text-surface-900">
                      {formatUSD(monthlyPayment)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between text-sm">
                    <span className="text-surface-500">Total monthly outflow</span>
                    <span className="font-mono font-medium text-surface-900">
                      {formatUSD(monthlyPayment + extra)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-surface-200">
                  <ResultStat
                    label="Payoff date"
                    value={payoffDate(scenario.months)}
                    sub={`Baseline: ${payoffDate(baseline.months)}`}
                    accent
                  />
                  <ResultStat
                    label="Time saved"
                    value={formatYearsMonths(Math.max(0, monthsSaved))}
                    sub={extra > 0 ? 'off your loan' : 'add some extra to start'}
                  />
                  <ResultStat
                    label="Interest saved"
                    value={formatUSD(Math.max(0, interestSaved))}
                    sub="over the life of the loan"
                  />
                </div>

                <div className="border-t border-surface-200 px-6 pb-6 pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-surface-900">
                      Loan balance over time
                    </h3>
                    <Legend />
                  </div>
                  <div className="mt-4 h-72">
                    <PayoffChart
                      baseline={baseline}
                      scenario={scenario}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-100 p-5">
                <Sparkles size={16} className="mt-0.5 flex-shrink-0 text-accent-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-900">
                    Want to save this scenario and track real progress?
                  </p>
                  <p className="mt-1 text-sm text-surface-600">
                    Sign up for free to compare multiple strategies side by side and update them as
                    your finances change.
                  </p>
                </div>
                <ButtonLink to="/signup" variant="primary" size="sm">
                  Start free <ArrowRight size={14} />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-surface-50">
        <Container size="md" className="py-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-surface-900 sm:text-3xl">
            How this works
          </h2>
          <div className="mt-6 grid gap-6 text-sm leading-relaxed text-surface-600 sm:grid-cols-2">
            <p>
              Every month, your scheduled payment splits between interest (paid to the bank) and
              principal (reducing your balance). Early in a 30-year loan, most of your payment is
              interest.
            </p>
            <p>
              When you pay extra, all of it goes to principal. That smaller balance generates less
              interest next month — and the savings compound over decades.
            </p>
            <p>
              The chart shows two paths: your baseline schedule and the scenario with extra
              principal. The shaded area between them is the interest you don't pay.
            </p>
            <p className="text-surface-500">
              <em>
                Educational only. Doesn't model PMI, taxes, insurance, or refinance scenarios — those
                live in the full app once you sign up.
              </em>
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}

function ResultStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  return (
    <div className="p-6">
      <div className="text-xs font-medium uppercase tracking-wider text-surface-400">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-semibold leading-tight tracking-tight ${
          accent ? 'text-accent-600' : 'text-surface-900'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-surface-500">{sub}</div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-surface-500">
      <span className="flex items-center gap-1.5">
        <span className="block h-0.5 w-5 bg-surface-300" />
        Baseline
      </span>
      <span className="flex items-center gap-1.5">
        <span className="block h-0.5 w-5 bg-accent-500" />
        With extra
      </span>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = 0,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  min?: number
  hint?: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-surface-700">{label}</span>
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => {
            const n = Number(e.target.value)
            onChange(Number.isFinite(n) ? Math.max(min, n) : min)
          }}
          step={step}
          min={min}
          className={`w-full rounded-md border border-surface-200 bg-white py-2.5 text-base text-surface-900 outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 ${
            prefix ? 'pl-7' : 'pl-3'
          } ${suffix ? 'pr-16' : 'pr-3'}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-surface-400">{hint}</p>}
    </label>
  )
}

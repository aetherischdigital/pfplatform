import { Check, Minus, ArrowRight, Sparkles } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'

type Tier = {
  name: string
  price?: string
  cadence?: string
  /** When true, show "Pricing TBD" in place of price/cadence. */
  comingSoon?: boolean
  blurb: string
  cta: string
  highlighted?: boolean
  features: string[]
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    blurb: 'Run the calculators, see your payoff date, and try the dashboard.',
    cta: 'Start free',
    features: [
      'Mortgage payoff calculator',
      'Basic equity projection',
      'Save one financial snapshot',
      'Read all educational content',
    ],
  },
  {
    name: 'Plus',
    comingSoon: true,
    blurb: 'For homeowners who want a living plan they update over time.',
    cta: 'Join the waitlist',
    highlighted: true,
    features: [
      'Everything in Free',
      'Full Personal Financial Statement',
      'Multi-scenario comparison',
      'Refinance + recast modeling',
      'Snapshot history',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    comingSoon: true,
    blurb: 'For realtors who want to stay top-of-mind with their book.',
    cta: 'Join the waitlist',
    features: [
      'Everything in Plus',
      'Manage up to 25 clients',
      'Branded shareable reports',
      'Edit-on-behalf with client permission',
      'Priority support',
    ],
  },
]

const compareRows: { label: string; values: (boolean | string)[] }[] = [
  { label: 'Mortgage payoff calculator', values: [true, true, true] },
  { label: 'Equity projection', values: ['Basic', 'Full', 'Full'] },
  { label: 'Personal Financial Statement', values: [false, true, true] },
  { label: 'Scenario comparison', values: [false, true, true] },
  { label: 'Snapshot history', values: [false, true, true] },
  { label: 'Refinance + recast modeling', values: [false, true, true] },
  { label: 'Manage clients', values: [false, false, 'Up to 25'] },
  { label: 'Branded reports', values: [false, false, true] },
  { label: 'Support', values: ['Self-serve', 'Email', 'Priority'] },
]

export default function Pricing() {
  return (
    <>
      <section className="bg-gradient-to-b from-surface-50 to-white">
        <Container className="py-20 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-100 px-3 py-1 text-xs font-medium text-accent-600">
            <Sparkles size={12} />
            Free today — paid tiers in preview
          </div>
          <h1 className="mx-auto mt-5 max-w-2xl font-display text-5xl font-semibold tracking-tight text-surface-900 sm:text-6xl">
            Simple pricing. Real value at every tier.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-surface-500">
            Start free today. Plus and Pro are in the works — reserve your spot now and we'll let you
            know the moment they're live.
          </p>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="pb-16">
          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`relative flex flex-col rounded-2xl border p-7 transition-[box-shadow,transform] duration-200 motion-reduce:hover:translate-y-0 ${
                  t.highlighted
                    ? 'border-surface-900 bg-surface-900 text-white shadow-card-lg hover:-translate-y-0.5'
                    : 'border-surface-200 bg-white shadow-card hover:-translate-y-0.5 hover:shadow-card-lg'
                }`}
              >
                {t.highlighted && !t.comingSoon && (
                  <span className="absolute -top-3 left-7 rounded-full bg-accent-500 px-3 py-1 text-xs font-medium text-white">
                    Most popular
                  </span>
                )}
                {t.comingSoon && (
                  <span className={`absolute -top-3 left-7 rounded-full px-3 py-1 text-xs font-medium ${
                    t.highlighted
                      ? 'bg-accent-500 text-white'
                      : 'bg-accent-100 text-accent-600'
                  }`}>
                    Coming soon
                  </span>
                )}
                <div>
                  <h3 className={`font-display text-xl font-semibold ${t.highlighted ? 'text-white' : 'text-surface-900'}`}>
                    {t.name}
                  </h3>
                  <p className={`mt-2 text-sm ${t.highlighted ? 'text-surface-300' : 'text-surface-500'}`}>
                    {t.blurb}
                  </p>
                </div>
                <div className="mt-6">
                  {t.comingSoon ? (
                    <div className="flex flex-col">
                      <span className={`font-display text-2xl font-semibold ${t.highlighted ? 'text-white' : 'text-surface-900'}`}>
                        Pricing TBD
                      </span>
                      <span className={`mt-1 text-sm ${t.highlighted ? 'text-surface-300' : 'text-surface-500'}`}>
                        Reserve your spot — no card required.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className={`font-display text-5xl font-semibold ${t.highlighted ? 'text-white' : 'text-surface-900'}`}>
                        {t.price}
                      </span>
                      {t.cadence && (
                        <span className={`text-sm ${t.highlighted ? 'text-surface-300' : 'text-surface-500'}`}>
                          {t.cadence}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ul className={`mt-6 flex-1 space-y-3 text-sm ${t.highlighted ? 'text-surface-100' : 'text-surface-700'}`}>
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${t.highlighted ? 'text-accent-400' : 'text-accent-500'}`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <ButtonLink
                    to="/signup"
                    variant={t.highlighted ? 'accent' : 'primary'}
                    size="md"
                    className="w-full"
                  >
                    {t.cta} <ArrowRight size={14} />
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface-50">
        <Container className="py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            Compare every plan.
          </h2>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-surface-200 bg-white">
            <table className="w-full min-w-[34rem]">
              <thead className="bg-surface-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Feature
                  </th>
                  {tiers.map((t) => (
                    <th
                      key={t.name}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        {t.name}
                        {t.comingSoon && (
                          <span className="rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal text-accent-600">
                            Soon
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {compareRows.map((row) => (
                  <tr key={row.label}>
                    <td className="px-6 py-4 text-sm text-surface-700">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-6 py-4 text-sm text-surface-900">
                        {v === true ? (
                          <Check size={16} className="text-accent-500" />
                        ) : v === false ? (
                          <Minus size={16} className="text-surface-300" />
                        ) : (
                          <span>{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="py-20 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            Have questions before you sign up?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-surface-500">
            Start free — no card, no commitment. Upgrade only if you find it useful.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/signup" variant="primary" size="lg">
              Start free <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}

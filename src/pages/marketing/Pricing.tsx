import type { CSSProperties } from 'react'
import { Check, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/marketing/PageHeader'
import '../preview/statement.css'

/* Pricing — rebuilt on the Statement vocabulary: gold-outlined tier cards (the
 * featured tier emphasised in gold), and a heritage comparison ledger. */

type Tier = {
  name: string
  price?: string
  cadence?: string
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
      <PageHeader
        kicker="Pricing · free today"
        title="Simple pricing. Real value at every tier."
        intro="Start free today. Plus and Pro are in the works — reserve your spot now and we'll let you know the moment they're live."
      />

      <div className="stmt">
        {/* ── Tiers ──────────────────────────────────────────────────────── */}
        <section className="stmt-section">
          <div className="stmt-wrap">
            <div className="grid gap-6 lg:grid-cols-3">
              {tiers.map((t) => {
                const tag = t.comingSoon ? 'Coming soon' : t.highlighted ? 'Most popular' : null
                return (
                  <div
                    key={t.name}
                    className="stmt-card"
                    style={t.highlighted ? { outlineColor: 'var(--gold)' } : undefined}
                  >
                    <div className="cap">
                      <span className="stmt-label" style={{ letterSpacing: '0.24em' }}>{t.name}</span>
                      {tag && <span className="stmt-ptag" style={{ color: 'var(--gold-deep)' }}>{tag}</span>}
                    </div>

                    <div style={{ marginTop: 14, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
                      {t.comingSoon ? (
                        <div className="stmt-display" style={{ fontSize: 30, fontWeight: 600 }}>Pricing TBD</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span className="stmt-display" style={{ fontSize: 52, fontWeight: 700 }}>{t.price}</span>
                          {t.cadence && <span style={{ color: 'var(--faint)' }}>{t.cadence}</span>}
                        </div>
                      )}
                      <p style={{ marginTop: 8, color: 'var(--soft)', fontSize: 16 }}>{t.blurb}</p>
                    </div>

                    <ul>
                      {t.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>

                    <div style={{ marginTop: 26 }}>
                      <Link
                        to="/signup"
                        className={`stmt-btn ${t.highlighted ? 'stmt-btn--gold' : 'stmt-btn--ghost'}`}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {t.cta}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Comparison ledger ──────────────────────────────────────────── */}
        <section className="stmt-section stmt-section--alt">
          <div className="stmt-wrap">
            <div className="stmt-head">
              <span className="stmt-label">Line by line</span>
              <h2 className="stmt-display stmt-h2" style={{ marginTop: 14 }}>Compare every plan.</h2>
            </div>
            <div style={{ marginTop: 32, overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 4, background: 'var(--color-white)' }}>
              <table style={{ width: '100%', minWidth: '34rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <th style={thStyle}>Feature</th>
                    {tiers.map((t) => (
                      <th key={t.name} style={thStyle}>{t.name}{t.comingSoon ? ' ·' : ''}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.label} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: '14px 22px', fontSize: 16, color: 'var(--soft)' }}>{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} style={{ padding: '14px 22px' }}>
                          {v === true ? (
                            <Check size={16} style={{ color: 'var(--gold-deep)' }} />
                          ) : v === false ? (
                            <Minus size={16} style={{ color: 'var(--line-strong)' }} />
                          ) : (
                            <span className="stmt-mono" style={{ fontSize: 13 }}>{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Closing ────────────────────────────────────────────────────── */}
        <section className="stmt-close">
          <div className="stmt-wrap">
            <div className="stmt-rule"><span className="l" /><span className="d" /><span className="l" /></div>
            <h2 className="stmt-display stmt-h2">Have questions before you sign up?</h2>
            <p className="stmt-sub" style={{ margin: '16px auto 0', maxWidth: '30em' }}>
              Start free — no card, no commitment. Upgrade only if you find it useful.
            </p>
            <div className="stmt-cta" style={{ justifyContent: 'center', marginTop: 32 }}>
              <Link to="/signup" className="stmt-btn stmt-btn--gold">Start free</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

const thStyle: CSSProperties = {
  padding: '14px 22px',
  textAlign: 'left',
  fontFamily: "'Marcellus', serif",
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--gold-deep)',
}

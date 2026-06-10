import { Link } from 'react-router-dom'
import PageHeader from '../../components/marketing/PageHeader'
import '../preview/statement.css'

/* How it works — rebuilt on the "Statement" rich vocabulary: alternating
 * paper/alt bands, Cormorant headings, § bullet lists, and the dark engraved
 * ledger plates for every visual. Shares the global chrome via MarketingLayout. */

type Section = {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  visual: 'pfs' | 'equity' | 'payoff' | 'realtor' | 'learn'
  anchor?: string
}

const sections: Section[] = [
  {
    eyebrow: 'Step 01',
    title: 'The PFS as your spine.',
    body: 'The Personal Financial Statement is the instrument a banker uses to evaluate a borrower. We turn it the other way around — into the living spine of your dashboard, so every payoff projection, prepayment plan, and equity report draws from one consistent picture of your finances.',
    bullets: [
      'Assets: home, retirement, cash, vehicles, other holdings',
      'Liabilities: mortgages, loans, credit lines with current balances',
      'Income and expenses, at the level of detail you choose',
    ],
    visual: 'pfs',
  },
  {
    eyebrow: 'Step 02',
    title: 'The amortization the bank should agree with.',
    body: 'Your loan has nothing to do with years or months. Every fixed-rate loan resolves to a numbered list of payments, each with a precise principal and interest split decided the day the Note is signed. We generate that schedule, store it as your ledger, and project equity off of it.',
    bullets: [
      'Full payment-by-payment amortization, generated from your Note',
      'Equity projection grounded in checkable math, not a forecast',
      'Reconcile each monthly statement against the ledger to catch errors',
    ],
    visual: 'equity',
  },
  {
    eyebrow: 'Step 03',
    title: 'Prepay with confidence.',
    body: 'The more additional principal you send, the faster the loan is retired. The platform tells you exactly what your balance should be after each additional payment. You’re not paying ahead — you’re retiring your mortgage early.',
    bullets: [
      'All additional principal prepayments accelerate the loan',
      'Compare your balance against your statement to check for accuracy',
      'Every prepayment updates your projected payoff and interest saved',
    ],
    visual: 'payoff',
  },
  {
    eyebrow: 'For realtors',
    title: 'Stay in the file long after closing.',
    body: 'Manage a roster of homeowner clients, view their plans with permission, and become the long-term advisor instead of the one-time transaction. Submit property-value updates, send reminders, and share payoff progress on a cadence you set.',
    bullets: [
      'Invite clients with one link; they keep ownership of their data',
      'View — or, with permission, edit — their dashboard alongside yours',
      'Reminder templates and branded reports for after-closing touchpoints',
    ],
    visual: 'realtor',
    anchor: 'realtors',
  },
  {
    eyebrow: 'Always-on',
    title: 'Education built around the method.',
    body: 'Articles, calculators, and walkthroughs that explain why the prepayment workflow works — when biweekly programs are a marketing trick, when a refinance is actually worth it, how to catch a servicer transfer that loses a payment in the seam.',
    bullets: [
      'Plain-English deep-dives on prepayment, PMI, servicer transfers',
      'When is a refinance feasible and beneficial?',
      'Public mortgage payoff calculator — no account required',
    ],
    visual: 'learn',
  },
]

export default function HowItWorks() {
  return (
    <>
      <PageHeader
        kicker="How it works"
        title="From a Note at closing to a ledger you control for thirty years."
        intro="Five tools, one product. The PFS, the amortization schedule, the prepayment workflow, the realtor surface, and the education that explains the math."
      />

      <div className="stmt">
        {sections.map((s, i) => {
          const reversed = i % 2 === 1
          return (
            <section
              key={s.title}
              id={s.anchor}
              className={`stmt-section scroll-mt-24 ${reversed ? 'stmt-section--alt' : ''}`}
            >
              <div className="stmt-wrap">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  <div className={reversed ? 'lg:order-2' : ''}>
                    <span className="stmt-label">{s.eyebrow}</span>
                    <h2 className="stmt-display stmt-h2" style={{ marginTop: 14 }}>
                      {s.title}
                    </h2>
                    <p className="stmt-sub">{s.body}</p>
                    <ul className="stmt-bullets">
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={reversed ? 'lg:order-1' : ''}>
                    <Visual kind={s.visual} />
                  </div>
                </div>
              </div>
            </section>
          )
        })}

        <section className="stmt-close" style={{ paddingTop: 40 }}>
          <div className="stmt-wrap">
            <div className="stmt-rule"><span className="l" /><span className="d" /><span className="l" /></div>
            <h2 className="stmt-display stmt-h2">Ready to start your ledger?</h2>
            <p className="stmt-sub" style={{ margin: '16px auto 0', maxWidth: '32em' }}>
              Five minutes of input gets you your full amortization schedule and a dashboard
              you&rsquo;ll actually use. Set up in five minutes.
            </p>
            <div className="stmt-cta" style={{ justifyContent: 'center', marginTop: 32 }}>
              <Link to="/signup" className="stmt-btn stmt-btn--gold">Get started <Arrow /></Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

/* ── Rich engraved-plate visuals ────────────────────────────────────────── */

function Visual({ kind }: { kind: Section['visual'] }) {
  if (kind === 'pfs') {
    return (
      <div className="stmt-plate">
        <div className="phead"><span className="t">Personal financial statement</span><span className="m">NET WORTH</span></div>
        <div className="stmt-pbig">$325,500</div>
        <div className="stmt-pline"><span className="lbl">Primary residence</span><span className="val">485,000</span></div>
        <div className="stmt-pline"><span className="lbl">Retirement (401k)</span><span className="val">142,800</span></div>
        <div className="stmt-pline"><span className="lbl">Cash &amp; savings</span><span className="val">28,400</span></div>
        <div className="stmt-pline hl"><span className="lbl">Mortgage balance</span><span className="val">−312,500</span></div>
        <div className="stmt-pline"><span className="lbl">Auto loan</span><span className="val dim">−18,200</span></div>
      </div>
    )
  }

  if (kind === 'equity') {
    return (
      <div className="stmt-plate">
        <div className="phead"><span className="t">Equity projection</span><span className="m">MODELED</span></div>
        <div className="stmt-figs">
          <div className="stmt-fig"><div className="k">Projected equity</div><div className="v gold">$312,400</div></div>
          <div className="stmt-fig"><div className="k">Per year</div><div className="v">+$48,200</div></div>
        </div>
        <div className="stmt-chart"><MiniChart /></div>
      </div>
    )
  }

  if (kind === 'payoff') {
    const rows = [
      ['Baseline', '30 yr 0 mo', '248,400', false],
      ['+$100/mo to principal', '26 yr 8 mo', '210,800', false],
      ['+$200/mo to principal', '24 yr 8 mo', '182,100', true],
    ] as const
    return (
      <div className="stmt-plate">
        <div className="phead"><span className="t">Payoff scenarios</span><span className="m">TOTAL INTEREST</span></div>
        {rows.map(([name, term, interest, hl]) => (
          <div className={`stmt-pline${hl ? ' hl' : ''}`} key={name}>
            <span className="lbl">{name}<span className="sub">{term}</span></span>
            <span className="val">{interest}</span>
          </div>
        ))}
      </div>
    )
  }

  if (kind === 'realtor') {
    const rows = [
      ['Maya Patel', 'On track', '8.4y sooner'],
      ['Daniel Cho', 'Awaiting input', '—'],
      ['The Reyes Family', 'On track', '11.1y sooner'],
      ['Jordan Lee', 'Behind plan', '4.2y sooner'],
    ] as const
    return (
      <div className="stmt-plate">
        <div className="phead"><span className="t">Client roster</span><span className="m">4 ACTIVE</span></div>
        {rows.map(([name, status, years]) => (
          <div className="stmt-pline" key={name}>
            <span className="lbl">{name}<span className="sub">{status}</span></span>
            <span className="val dim">{years}</span>
          </div>
        ))}
      </div>
    )
  }

  // learn
  const posts = [
    ['Strategy', 'When biweekly payments beat extra principal'],
    ['Calculator', 'See your payoff date in under 60 seconds'],
    ['Explainer', 'Refinance — when is it actually worth it'],
  ] as const
  return (
    <div className="stmt-plate">
      <div className="phead"><span className="t">From the blog</span><span className="m">LATEST</span></div>
      {posts.map(([tag, title]) => (
        <div className="stmt-pline" key={title} style={{ display: 'block' }}>
          <span className="stmt-ptag">{tag}</span>
          <div className="lbl" style={{ marginTop: 4 }}>{title}</div>
        </div>
      ))}
    </div>
  )
}

function MiniChart() {
  const equity = '6,72 60,64 120,50 180,34 240,20 300,10'
  const balance = '6,12 60,20 120,34 180,50 240,62 300,72'
  return (
    <svg viewBox="0 0 306 84" role="img" aria-label="Equity rising as balance falls">
      {[24, 44, 64].map((y) => (
        <line key={y} x1="6" y1={y} x2="300" y2={y} style={{ stroke: 'var(--color-surface-50)', opacity: 0.07 }} strokeWidth="1" />
      ))}
      <polygon points={`${equity} 300,80 6,80`} style={{ fill: 'var(--color-accent-400)', opacity: 0.18 }} />
      <polyline points={equity} fill="none" style={{ stroke: 'var(--color-accent-400)' }} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={balance} fill="none" style={{ stroke: 'var(--color-surface-50)', opacity: 0.4 }} strokeWidth="1.5" strokeDasharray="3 3" strokeLinejoin="round" />
      <circle cx="300" cy="10" r="3.5" style={{ fill: 'var(--color-accent-400)' }} />
    </svg>
  )
}

function Arrow() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

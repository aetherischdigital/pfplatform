import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../../components/ui/Button'
import PageHeader from '../../components/marketing/PageHeader'
import { BRAND } from '../../config/brand'
import '../preview/statement.css'

/* PFS — the individual-facing product page, rebuilt on the Statement vocabulary
 * (engraved statement plate + numbered method). Shares chrome via MarketingLayout. */

const pillars = [
  {
    title: 'Your amortization, line by line',
    body: 'Every scheduled payment as a numbered row, with the exact principal and interest split. The source of truth your bank should agree with.',
  },
  {
    title: 'Prepay in exact principal amounts',
    body: 'Knock future payments off the schedule by paying their principal portion now. We tell you the exact dollar amount — no rounding, no drift, no fee programs.',
  },
  {
    title: 'Finding Hidden Money',
    body: 'Most homeowners have an extra mortgage payment hidden in their paycheck every year. We help you find it — in your pay cycle, your refund, your budget — and put it to work on principal.',
  },
]

export default function PFS() {
  return (
    <>
      <PageHeader
        kicker="For individuals"
        title={
          <>
            Your Personal
            <br />
            Financial Statement.
          </>
        }
        intro={
          <>
            The same instrument a banker uses to size you up — assets, liabilities, income, and
            expenses — kept as a living document you control. It&rsquo;s the spine of {BRAND.name},
            and the reason every projection has real numbers behind it.
          </>
        }
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/signup" variant="accent" size="lg">
            Start free <ArrowRight size={16} />
          </ButtonLink>
          <ButtonLink to="/calculator" variant="secondary" size="lg">
            Try the calculator
          </ButtonLink>
        </div>
      </PageHeader>

      <div className="stmt">
        {/* ── The instrument ─────────────────────────────────────────────── */}
        <section className="stmt-section">
          <div className="stmt-wrap">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <span className="stmt-label">The instrument</span>
                <h2 className="stmt-display stmt-h2" style={{ marginTop: 14 }}>
                  Four sections. One honest picture of where you stand.
                </h2>
                <p className="stmt-sub">
                  A personal financial statement balances what you own against what you owe, and what
                  comes in against what goes out. We keep it current, do the arithmetic, and turn it
                  into the dashboard you actually log in to see.
                </p>
                <ul className="stmt-bullets">
                  <li>Assets — home, retirement, cash, other holdings</li>
                  <li>Liabilities — mortgage, loans, credit lines</li>
                  <li>Income &amp; expenses, at the detail you choose</li>
                </ul>
              </div>

              <div className="stmt-plate">
                <div className="phead"><span className="t">Personal financial statement</span><span className="m">NET WORTH</span></div>
                <div className="stmt-pbig">$202,310</div>
                <div className="stmt-pline"><span className="lbl">Primary residence</span><span className="val">420,000</span></div>
                <div className="stmt-pline"><span className="lbl">Retirement &amp; investments</span><span className="val">86,400</span></div>
                <div className="stmt-pline"><span className="lbl">Cash &amp; savings</span><span className="val">18,250</span></div>
                <div className="stmt-pline hl"><span className="lbl">Mortgage</span><span className="val">−312,540</span></div>
                <div className="stmt-pline"><span className="lbl">Auto loan</span><span className="val dim">−9,800</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The mortgage at its center ─────────────────────────────────── */}
        <section className="stmt-section stmt-section--alt">
          <div className="stmt-wrap">
            <div className="stmt-head">
              <span className="stmt-label">The mortgage at its center</span>
              <h2 className="stmt-display stmt-h2" style={{ marginTop: 14 }}>
                For most people, the biggest line on the statement is the house.
              </h2>
              <p className="stmt-sub">
                So that&rsquo;s where the platform does its sharpest work — turning your loan into a
                ledger you can audit, accelerate, and own.
              </p>
            </div>
            <ol className="stmt-method" style={{ marginTop: 36 }}>
              {pillars.map((p, i) => (
                <li key={p.title}>
                  <span className="no">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h4>{p.title}</h4>
                    <p>{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Closing ────────────────────────────────────────────────────── */}
        <section className="stmt-close">
          <div className="stmt-wrap">
            <div className="stmt-rule"><span className="l" /><span className="d" /><span className="l" /></div>
            <h2 className="stmt-display stmt-h2">Start with the statement.</h2>
            <p className="stmt-sub" style={{ margin: '16px auto 0', maxWidth: '32em' }}>
              Five minutes of input builds your ledger. From there, every number on your dashboard is
              grounded in something real. Free for as long as you need it.
            </p>
            <div className="stmt-cta" style={{ justifyContent: 'center', marginTop: 32 }}>
              <Link to="/signup" className="stmt-btn stmt-btn--gold">
                Start free
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden>
                  <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

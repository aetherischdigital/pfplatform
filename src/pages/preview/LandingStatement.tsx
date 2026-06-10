import { useState } from 'react'
import { Link } from 'react-router-dom'
import './statement.css'

/* ════════════════════════════════════════════════════════════════════════
 * Landing — "THE STATEMENT"   (temp preview · /landing-a)
 *
 * The rich heritage direction restored — dark engraved ledger plates, walnut
 * foil, paper grain, Cormorant — but every colour runs through the theme
 * tokens, so it themes light/dark (toggle in the header). The gimmicky hero
 * (wax seal / guilloché / certificate frame) is gone; the hero now leads with
 * a real payoff chart on a ledger plate. Styling in statement.css.
 * ════════════════════════════════════════════════════════════════════════ */

export default function LandingStatement() {
  const [holds, setHolds] = useState(true)

  return (
    <div className="stmt">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="stmt-hero">
        <div className="stmt-wrap">
          <div className="stmt-hero-grid">
            <div>
              <div className="stmt-eyebrow stmt-rise">
                <span className="rule" />
                <span className="stmt-label">Personal Financial Platform</span>
              </div>
              <h1 className="stmt-display stmt-h1 stmt-rise" style={{ animationDelay: '70ms' }}>
                Own the home
                <br />
                you&rsquo;re <span className="em">paying for.</span>
              </h1>
              <p className="stmt-lede stmt-rise" style={{ animationDelay: '150ms' }}>
                Keep your own books the way a banker keeps theirs. We turn your mortgage into a
                ledger you can <b>audit, accelerate, and finally own</b> — so every error the bank
                makes stops costing you the day it happens.
              </p>
              <div className="stmt-cta stmt-rise" style={{ animationDelay: '230ms' }}>
                <Link to="/signup" className="stmt-btn stmt-btn--gold">Open your ledger <Arrow /></Link>
                <Link to="/how-it-works" className="stmt-btn stmt-btn--ghost">See the method</Link>
              </div>
              <div className="stmt-fine stmt-rise" style={{ animationDelay: '310ms' }}>
                <span>NO BANK LOGINS</span><span className="pipe" />
                <span>NO THIRD-PARTY SYNCING</span><span className="pipe" />
                <span>EXPORT ANYTIME</span>
              </div>
            </div>

            <div className="stmt-rise" style={{ animationDelay: '190ms' }}>
              <div className="stmt-plate">
                <div className="phead">
                  <span className="t">Your ledger at a glance</span>
                  <span className="m">30-YR · 6.5%</span>
                </div>
                <div className="stmt-figs">
                  <div className="stmt-fig">
                    <div className="k">Mortgage paid off</div>
                    <div className="v">Apr 2032</div>
                  </div>
                  <div className="stmt-fig">
                    <div className="k">Interest saved</div>
                    <div className="v gold">$184,210</div>
                  </div>
                </div>
                <div className="stmt-chart">
                  <PayoffChart />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two endorsements (audience triage) ──────────────────────────── */}
      <section className="stmt-section">
        <div className="stmt-wrap">
          <div className="stmt-head">
            <span className="stmt-label">Endorsed by two parties</span>
            <h2 className="stmt-h2 stmt-display">
              The same statement, signed from both sides of the table.
            </h2>
            <p className="stmt-sub">
              One platform underneath. Tell us which signature is yours and we&rsquo;ll open the
              right ledger.
            </p>
            <div className="stmt-toggle-row" role="group" aria-label="Do you hold a mortgage?">
              <button type="button" className={holds ? 'on' : ''} onClick={() => setHolds(true)}>
                I hold a mortgage
              </button>
              <button type="button" className={!holds ? 'on' : ''} onClick={() => setHolds(false)}>
                Not yet — planning
              </button>
            </div>
            <p className="stmt-note">
              {holds
                ? 'Then we begin by auditing the Note you already signed — and finding the years hidden inside it.'
                : 'Then we set your statement before you sign, so you know to the penny what every term will cost.'}
            </p>
          </div>

          <div className="stmt-cards">
            <Endorsement
              num="I."
              role="The Homeowner"
              title="Keep your own books to audit the bank."
              to="/pfs"
              cta="Open the homeowner ledger"
              points={[
                'A living Personal Financial Statement — the banker’s own instrument',
                'Your amortization, line by line, split to the penny',
                'Send additional principal and retire your loan years early',
                'Find the hidden payment already sitting in your paycheck',
              ]}
            />
            <Endorsement
              num="II."
              role="The Realtor / Advisor"
              title="Stay in the file long after the closing."
              to="/how-it-works#realtors"
              cta="Open the advisor ledger"
              points={[
                'Hold a roster and stay in your clients’ financial lives',
                'Share custom payoff plans under your own name',
                'Be the advisor who brings the math, not just the handshake',
                'A reason to call that has nothing to do with the next sale',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── The mechanic on the plate + method ──────────────────────────── */}
      <section className="stmt-section stmt-section--alt">
        <div className="stmt-wrap">
          <div className="stmt-ledger-grid">
            <div className="stmt-plate">
              <div className="phead">
                <span className="t">Schedule of Principal</span>
                <span className="m">30-YR · 6.5%</span>
              </div>
              <div className="stmt-row h">
                <span>#</span><span className="r">Principal</span><span className="r">Interest</span><span className="r">Balance</span>
              </div>
              {[
                ['044', '410.12', '2,118.10', '390,652', false],
                ['045', '412.34', '2,115.88', '390,240', false],
                ['046', '414.57', '2,113.65', '389,825', false],
                ['047', '416.82', '2,111.40', '389,408', false],
                ['048', '419.07', '2,109.15', '388,989', false],
              ].map(([n, p, i, b, retired]) => (
                <div className={`stmt-row${retired ? ' retired' : ''}`} key={n as string}>
                  <span className="dim">{n}</span>
                  <span className={`r${retired ? ' strike' : ''}`}>{p}</span>
                  <span className={`r dim${retired ? ' strike' : ''}`}>{i}</span>
                  <span className="r">{b}</span>
                  {retired ? <span className="stamp">RETIRED</span> : null}
                </div>
              ))}
              <div className="pfoot">
                <span><span className="k">+$250/MO TO PRINCIPAL</span></span>
                <span>RETIRE 9.4 YRS SOONER →</span>
              </div>
            </div>

            <div>
              <span className="stmt-label">The method</span>
              <h2 className="stmt-h2 stmt-display" style={{ marginTop: 16 }}>
                Your loan has nothing to do with years or months.
              </h2>
              <p className="stmt-sub" style={{ marginBottom: 8 }}>
                It&rsquo;s 360 numbered payments, each split to the penny. Retire them faster — in the
                right order — and you own your home sooner.
              </p>
              <ol className="stmt-method">
                <li>
                  <span className="no">01</span>
                  <div>
                    <h4>Audit every payment</h4>
                    <p>Your amortization schedule, generated from your Note — the truth the bank should agree with.</p>
                  </div>
                </li>
                <li>
                  <span className="no">02</span>
                  <div>
                    <h4>Prepay with confidence</h4>
                    <p>The more additional principal you send, the faster the loan is retired — you&rsquo;re not paying ahead, you&rsquo;re retiring it early.</p>
                  </div>
                </li>
                <li>
                  <span className="no">03</span>
                  <div>
                    <h4>Find the hidden money</h4>
                    <p>Most homeowners have an extra payment hidden in their year. We help you find it and put it to work.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── Proof band ──────────────────────────────────────────────────── */}
      <section className="stmt-section" style={{ paddingTop: 0 }}>
        <div className="stmt-wrap">
          <div className="stmt-proof">
            <div className="cell"><div className="v">$184k</div><div className="k">Interest saved · modeled</div></div>
            <div className="cell"><div className="v">9.4 yrs</div><div className="k">Payoff pulled forward</div></div>
            <div className="cell"><div className="v">0</div><div className="k">Bank logins required</div></div>
          </div>
          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--faint)' }}>
            Modeled on a $400,000 30-year fixed at 6.5% with $250/month redirected to principal.{' '}
            <Link to="/calculator" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>
              Run your own numbers
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Closing ─────────────────────────────────────────────────────── */}
      <section className="stmt-close">
        <div className="stmt-wrap">
          <div className="stmt-rule"><span className="l" /><span className="d" /><span className="l" /></div>
          <h2 className="stmt-display stmt-h2">
            Eliminating debt. <span className="em">Creating ownership.</span>
          </h2>
          <p className="stmt-sub" style={{ margin: '18px auto 0', maxWidth: '34em' }}>
            Five minutes of input opens your statement. A schedule the bank should agree with, and
            the tools to keep them honest — yours from the day you join.
          </p>
          <div className="stmt-cta" style={{ justifyContent: 'center', marginTop: 34 }}>
            <Link to="/signup" className="stmt-btn stmt-btn--gold">Open your ledger <Arrow /></Link>
            <Link to="/pfs" className="stmt-btn stmt-btn--ghost">For homeowners</Link>
          </div>
        </div>
      </section>

    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Endorsement({
  num, role, title, points, to, cta,
}: {
  num: string; role: string; title: string; points: string[]; to: string; cta: string
}) {
  return (
    <Link to={to} className="stmt-card">
      <div className="cap">
        <span className="stmt-label" style={{ letterSpacing: '0.24em' }}>{role}</span>
        <span className="num">{num}</span>
      </div>
      <h3 className="stmt-display">{title}</h3>
      <ul>{points.map((p) => <li key={p}>{p}</li>)}</ul>
      <div className="stmt-sign">
        <span className="x">{role}</span>
        <span className="go">{cta} <Arrow /></span>
      </div>
    </Link>
  )
}

/** A real payoff/equity chart — balance falling, equity rising, gold area. */
function PayoffChart() {
  const equity = '8,104 70,92 132,72 194,48 256,28 312,14'
  const balance = '8,18 70,30 132,52 194,74 256,92 312,104'
  return (
    <svg viewBox="0 0 320 122" role="img" aria-label="Projected equity rising as the balance falls">
      {/* baseline grid */}
      {[30, 60, 90].map((y) => (
        <line key={y} x1="8" y1={y} x2="312" y2={y} style={{ stroke: 'var(--color-surface-50)', opacity: 0.07 }} strokeWidth="1" />
      ))}
      {/* equity area */}
      <polygon
        points={`${equity} 312,116 8,116`}
        style={{ fill: 'var(--color-accent-400)', opacity: 0.18 }}
      />
      {/* equity line */}
      <polyline points={equity} fill="none" style={{ stroke: 'var(--color-accent-400)' }} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* balance line */}
      <polyline points={balance} fill="none" style={{ stroke: 'var(--color-surface-50)', opacity: 0.4 }} strokeWidth="1.5" strokeDasharray="3 3" strokeLinejoin="round" />
      {/* end marker */}
      <circle cx="312" cy="14" r="3.5" style={{ fill: 'var(--color-accent-400)' }} />
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

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './statement.css'

/* ════════════════════════════════════════════════════════════════════════
 * Landing — "THE STATEMENT"
 *
 * Triages the visitor across Thomas's 2×2 (product × audience). One `persona`
 * state — homeowner with a mortgage / future buyer / advisor (realtor or loan
 * officer) — drives the WHOLE page: hero, the method section, the proof band,
 * and the closing all swap to speak to whoever's selected. The hero is locked
 * to a constant size (reserved lede height + equal-height plates) so switching
 * is a clean swap, not a layout jump.
 *
 * Honesty guards: the buyer's "connect me to a lender" is a hand-off to the
 * advisors this page recruits, not an in-app feature; the advisor CTA points at
 * the model (How it works), not a live roster (Phase 2). Styling in statement.css.
 * ════════════════════════════════════════════════════════════════════════ */

type Persona = 'owner' | 'buyer' | 'advisor'

const SWITCH: { id: Persona; label: string }[] = [
  { id: 'owner', label: 'I have a mortgage' },
  { id: 'buyer', label: 'I’m planning to buy' },
  { id: 'advisor', label: 'I advise clients' },
]

/* ── Hero copy ───────────────────────────────────────────────────────────── */
const HERO: Record<
  Persona,
  {
    h1: ReactNode
    lede: ReactNode
    primary: { label: string; to: string }
    secondary: { label: string; to: string }
  }
> = {
  owner: {
    h1: (
      <>
        Own the home
        <br />
        you&rsquo;re <span className="em">paying for.</span>
      </>
    ),
    lede: (
      <>
        Keep your own books the way a banker keeps theirs. We turn your mortgage into a ledger you
        can <b>audit, accelerate, and finally own</b> — so every error the bank makes stops costing
        you the day it happens.
      </>
    ),
    primary: { label: 'Open your ledger', to: '/signup' },
    secondary: { label: 'See the method', to: '/how-it-works' },
  },
  buyer: {
    h1: (
      <>
        Know your number
        <br />
        before you <span className="em">shop.</span>
      </>
    ),
    lede: (
      <>
        Get your house in order before you ever tour one. Build your financial statement, see your{' '}
        <b>net worth and monthly room to spend</b>, and learn the payment you can carry. When
        you&rsquo;re ready, your advisor takes it from here.
      </>
    ),
    primary: { label: 'Know your number', to: '/signup' },
    secondary: { label: 'Run the calculator', to: '/calculator' },
  },
  advisor: {
    h1: (
      <>
        Stay in the file
        <br />
        after the <span className="em">close.</span>
      </>
    ),
    lede: (
      <>
        Be the advisor who brings the math, not just the handshake. Put the payoff method in your
        clients&rsquo; hands under <b>your own name</b> — and earn a reason to call that has nothing
        to do with the next sale.
      </>
    ),
    primary: { label: 'See the advisor model', to: '/how-it-works#realtors' },
    secondary: { label: 'View pricing', to: '/pricing' },
  },
}

/* ── Hero plate (figures + chart) — same structure for every persona so the
 *    plate height never changes between doors. ─────────────────────────────── */
type ChartKind = 'payoff' | 'rise' | 'bars'
const HERO_PLATE: Record<
  Persona,
  { head: string; meta: string; figs: { k: string; v: string; gold?: boolean }[]; chart: ChartKind }
> = {
  owner: {
    head: 'Your ledger at a glance',
    meta: '30-YR · 6.5%',
    figs: [
      { k: 'Mortgage paid off', v: 'Apr 2032' },
      { k: 'Interest saved', v: '$184,210', gold: true },
    ],
    chart: 'payoff',
  },
  buyer: {
    head: 'Your statement at a glance',
    meta: 'PRE-PURCHASE',
    figs: [
      { k: 'Net worth', v: '$84,300' },
      { k: 'Monthly room to spend', v: '$1,240', gold: true },
    ],
    chart: 'rise',
  },
  advisor: {
    head: 'Your book at a glance',
    meta: '12 ACTIVE',
    figs: [
      { k: 'Active clients', v: '12' },
      { k: 'Avg years saved', v: '6.1', gold: true },
    ],
    chart: 'bars',
  },
}

/* ── Endorsement note (under the two cards) ──────────────────────────────── */
const NOTE: Record<Persona, string> = {
  owner: 'We begin by auditing the Note you already signed — and finding the years hidden inside it.',
  buyer: 'We start with your statement, so you know what you can carry before you ever make an offer.',
  advisor: 'You bring the math and the follow-up; your name stays on every plan your clients open.',
}

/* ── Method section ──────────────────────────────────────────────────────── */
const METHOD: Record<
  Persona,
  { plate: ReactNode; label: string; h2: ReactNode; sub: ReactNode; steps: { n: string; h: string; p: string }[] }
> = {
  owner: {
    plate: <SchedulePlate />,
    label: 'The method',
    h2: 'Your loan has nothing to do with years or months.',
    sub: 'It’s 360 numbered payments, each split to the penny. Retire them faster — in the right order — and you own your home sooner.',
    steps: [
      { n: '01', h: 'Audit every payment', p: 'Your amortization schedule, generated from your Note — the truth the bank should agree with.' },
      { n: '02', h: 'Prepay with confidence', p: 'The more additional principal you send, the faster the loan is retired — you’re not paying ahead, you’re retiring it early.' },
      { n: '03', h: 'Find the hidden money', p: 'Most homeowners have an extra payment hidden in their year. We help you find it and put it to work.' },
    ],
  },
  buyer: {
    plate: <StatementPlate />,
    label: 'Before you borrow',
    h2: 'Know what you can carry before a lender runs your credit.',
    sub: 'A mortgage is just numbers you haven’t met yet. Build your statement first, and you’ll walk into the purchase knowing the payment you can live with.',
    steps: [
      { n: '01', h: 'Build your statement', p: 'Assets, debts, income, and spending in one place — the banker’s own instrument, kept by you.' },
      { n: '02', h: 'See your real room', p: 'Watch your net worth and monthly leftover take shape, so the payment you can carry is a number, not a guess.' },
      { n: '03', h: 'Hand off when you’re ready', p: 'When it’s time to buy, your advisor takes the statement you’ve built and finds the loan to match.' },
    ],
  },
  advisor: {
    plate: <RosterPlate />,
    label: 'The advisor model',
    h2: 'Buy the method for your clients. Stay in their financial lives.',
    sub: 'One enrollment puts the payoff tools in your client’s hands under your name. They keep the ledger; you bring the recommendations.',
    steps: [
      { n: '01', h: 'Enroll your client', p: 'One link puts the statement and payoff tools in their hands, branded to you.' },
      { n: '02', h: 'Share plans under your name', p: 'Send custom payoff plans your clients open as yours — never the bank’s.' },
      { n: '03', h: 'Stay in the file', p: 'A standing reason to call that has nothing to do with the next sale.' },
    ],
  },
}

/* ── Proof band ──────────────────────────────────────────────────────────── */
const PROOF: Record<Persona, { stats: { v: string; k: string }[]; caption: ReactNode }> = {
  owner: {
    stats: [
      { v: '$184k', k: 'Interest saved · modeled' },
      { v: '9.4 yrs', k: 'Payoff pulled forward' },
      { v: '0', k: 'Bank logins required' },
    ],
    caption: (
      <>
        Modeled on a $400,000 30-year fixed at 6.5% with $250/month redirected to principal.{' '}
        <Link to="/calculator" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>
          Run your own numbers
        </Link>
        .
      </>
    ),
  },
  buyer: {
    stats: [
      { v: '5 min', k: 'To open your statement' },
      { v: '$0', k: 'To start tracking' },
      { v: '0', k: 'Bank logins required' },
    ],
    caption: (
      <>
        Open your statement free. When you’re ready to buy, we’ll connect you with an advisor who can
        take it from there.{' '}
        <Link to="/calculator" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>
          Run your own numbers
        </Link>
        .
      </>
    ),
  },
  advisor: {
    stats: [
      { v: '25', k: 'Clients per roster' },
      { v: '100%', k: 'Your brand on every plan' },
      { v: '$0', k: 'Lead fees to us' },
    ],
    caption: (
      <>
        Built for realtors and loan officers who want to stay in the file.{' '}
        <Link to="/how-it-works#realtors" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>
          See the advisor model
        </Link>
        .
      </>
    ),
  },
}

/* ── Closing ─────────────────────────────────────────────────────────────── */
const CLOSING: Record<
  Persona,
  { h2: ReactNode; sub: string; primary: { label: string; to: string }; secondary: { label: string; to: string } }
> = {
  owner: {
    h2: (
      <>
        Eliminating debt. <span className="em">Creating ownership.</span>
      </>
    ),
    sub: 'Five minutes of input opens your statement. A schedule the bank should agree with, and the tools to keep them honest — yours from the day you join.',
    primary: { label: 'Open your ledger', to: '/signup' },
    secondary: { label: 'For homeowners', to: '/pfs' },
  },
  buyer: {
    h2: (
      <>
        Get ready. <span className="em">Then go get it.</span>
      </>
    ),
    sub: 'Build your statement in five minutes. Know your number, and walk into your purchase as the most prepared buyer in the room.',
    primary: { label: 'Know your number', to: '/signup' },
    secondary: { label: 'Run the calculator', to: '/calculator' },
  },
  advisor: {
    h2: (
      <>
        Bring the math. <span className="em">Keep the relationship.</span>
      </>
    ),
    sub: 'Put the payoff method in your clients’ hands under your name, and stay in the file long after the keys change hands.',
    primary: { label: 'See the advisor model', to: '/how-it-works#realtors' },
    secondary: { label: 'View pricing', to: '/pricing' },
  },
}

export default function LandingStatement() {
  const [persona, setPersona] = useState<Persona>('owner')
  const hero = HERO[persona]
  const method = METHOD[persona]
  const proof = PROOF[persona]
  const closing = CLOSING[persona]

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

              {/* Persona switch — single source of truth for the whole page. */}
              <div
                className="stmt-toggle-row stmt-rise"
                role="group"
                aria-label="Who are you?"
                style={{ animationDelay: '40ms' }}
              >
                {SWITCH.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={persona === id ? 'on' : ''}
                    aria-pressed={persona === id}
                    onClick={() => setPersona(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <h1 className="stmt-display stmt-h1 stmt-rise" style={{ animationDelay: '110ms' }}>
                {hero.h1}
              </h1>
              <p className="stmt-lede stmt-rise" style={{ animationDelay: '180ms' }}>
                {hero.lede}
              </p>
              <div className="stmt-cta stmt-rise" style={{ animationDelay: '250ms' }}>
                <Link to={hero.primary.to} className="stmt-btn stmt-btn--gold">
                  {hero.primary.label} <Arrow />
                </Link>
                <Link to={hero.secondary.to} className="stmt-btn stmt-btn--ghost">
                  {hero.secondary.label}
                </Link>
              </div>
              <div className="stmt-fine stmt-rise" style={{ animationDelay: '330ms' }}>
                <span>NO BANK LOGINS</span><span className="pipe" />
                <span>NO THIRD-PARTY SYNCING</span><span className="pipe" />
                <span>EXPORT ANYTIME</span>
              </div>
            </div>

            <div className="stmt-rise" style={{ animationDelay: '190ms' }}>
              <HeroPlate persona={persona} />
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
              One platform underneath — a ledger that opens to whichever signature is yours.
            </p>
            <p className="stmt-note">{NOTE[persona]}</p>
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
            {method.plate}

            <div>
              <span className="stmt-label">{method.label}</span>
              <h2 className="stmt-h2 stmt-display" style={{ marginTop: 16 }}>
                {method.h2}
              </h2>
              <p className="stmt-sub" style={{ marginBottom: 8 }}>
                {method.sub}
              </p>
              <ol className="stmt-method">
                {method.steps.map((s) => (
                  <li key={s.n}>
                    <span className="no">{s.n}</span>
                    <div>
                      <h4>{s.h}</h4>
                      <p>{s.p}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── Proof band ──────────────────────────────────────────────────── */}
      <section className="stmt-section" style={{ paddingTop: 0 }}>
        <div className="stmt-wrap">
          <div className="stmt-proof">
            {proof.stats.map((s) => (
              <div className="cell" key={s.k}>
                <div className="v">{s.v}</div>
                <div className="k">{s.k}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--faint)' }}>
            {proof.caption}
          </p>
        </div>
      </section>

      {/* ── Closing ─────────────────────────────────────────────────────── */}
      <section className="stmt-close">
        <div className="stmt-wrap">
          <div className="stmt-rule"><span className="l" /><span className="d" /><span className="l" /></div>
          <h2 className="stmt-display stmt-h2">{closing.h2}</h2>
          <p className="stmt-sub" style={{ margin: '18px auto 0', maxWidth: '34em' }}>
            {closing.sub}
          </p>
          <div className="stmt-cta" style={{ justifyContent: 'center', marginTop: 34 }}>
            <Link to={closing.primary.to} className="stmt-btn stmt-btn--gold">
              {closing.primary.label} <Arrow />
            </Link>
            <Link to={closing.secondary.to} className="stmt-btn stmt-btn--ghost">
              {closing.secondary.label}
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

/* ── Plates ──────────────────────────────────────────────────────────────── */

/** Right-side hero plate — identical structure (head · 2 figures · chart) for
 *  every persona, so its height is constant and the hero never resizes. */
function HeroPlate({ persona }: { persona: Persona }) {
  const p = HERO_PLATE[persona]
  return (
    <div className="stmt-plate">
      <div className="phead">
        <span className="t">{p.head}</span>
        <span className="m">{p.meta}</span>
      </div>
      <div className="stmt-figs">
        {p.figs.map((f) => (
          <div className="stmt-fig" key={f.k}>
            <div className="k">{f.k}</div>
            <div className={`v${f.gold ? ' gold' : ''}`}>{f.v}</div>
          </div>
        ))}
      </div>
      <div className="stmt-chart">
        {p.chart === 'payoff' ? <PayoffChart /> : p.chart === 'rise' ? <RiseChart /> : <BarsChart />}
      </div>
    </div>
  )
}

/** Owner method plate — the amortization schedule. */
function SchedulePlate() {
  return (
    <div className="stmt-plate">
      <div className="phead">
        <span className="t">Schedule of Principal</span>
        <span className="m">30-YR · 6.5%</span>
      </div>
      <div className="stmt-row h">
        <span>#</span><span className="r">Principal</span><span className="r">Interest</span><span className="r">Balance</span>
      </div>
      {[
        ['044', '410.12', '2,118.10', '390,652'],
        ['045', '412.34', '2,115.88', '390,240'],
        ['046', '414.57', '2,113.65', '389,825'],
        ['047', '416.82', '2,111.40', '389,408'],
        ['048', '419.07', '2,109.15', '388,989'],
      ].map(([n, pr, i, b]) => (
        <div className="stmt-row" key={n}>
          <span className="dim">{n}</span>
          <span className="r">{pr}</span>
          <span className="r dim">{i}</span>
          <span className="r">{b}</span>
        </div>
      ))}
      <div className="pfoot">
        <span><span className="k">+$250/MO TO PRINCIPAL</span></span>
        <span>RETIRE 9.4 YRS SOONER →</span>
      </div>
    </div>
  )
}

/** Buyer method plate — a Personal Financial Statement snapshot. */
function StatementPlate() {
  return (
    <div className="stmt-plate">
      <div className="phead">
        <span className="t">Your statement</span>
        <span className="m">PRE-PURCHASE</span>
      </div>
      <div className="stmt-pline">
        <span className="lbl">Assets<span className="sub">CASH · RETIREMENT · INVESTMENTS</span></span>
        <span className="val">$96,400</span>
      </div>
      <div className="stmt-pline">
        <span className="lbl">Liabilities<span className="sub">AUTO · STUDENT · CARDS</span></span>
        <span className="val dim">$12,100</span>
      </div>
      <div className="stmt-pline">
        <span className="lbl">Income<span className="sub">MONTHLY · TAKE-HOME</span></span>
        <span className="val">$6,250</span>
      </div>
      <div className="stmt-pline">
        <span className="lbl">Spending<span className="sub">HOUSING · LIVING · DEBT</span></span>
        <span className="val dim">$5,010</span>
      </div>
      <div className="stmt-pline hl">
        <span className="lbl">Monthly room to spend</span>
        <span className="val">$1,240</span>
      </div>
      <div className="pfoot">
        <span><span className="k">NET WORTH</span></span>
        <span>$84,300 →</span>
      </div>
    </div>
  )
}

/** Advisor method plate — a client roster, plans shared under the advisor's name. */
function RosterPlate() {
  return (
    <div className="stmt-plate">
      <div className="phead">
        <span className="t">Your client roster</span>
        <span className="m">12 ACTIVE</span>
      </div>
      <div className="stmt-pline hl">
        <span className="lbl">The Alvarez file<span className="sub">30-YR FIXED · RETIRE 2031</span></span>
        <span className="val">−7.2 yrs</span>
      </div>
      <div className="stmt-pline">
        <span className="lbl">M. Okafor<span className="sub">REFI MODELED · RETIRE 2034</span></span>
        <span className="val dim">−4.1 yrs</span>
      </div>
      <div className="stmt-pline">
        <span className="lbl">D. &amp; R. Bishop<span className="sub">EXTRA $300/MO · RETIRE 2030</span></span>
        <span className="val dim">−8.5 yrs</span>
      </div>
      <div className="stmt-pline">
        <span className="lbl">First-time buyer<span className="sub">BUILDING THE STATEMENT</span></span>
        <span className="val dim">Getting ready</span>
      </div>
      <div className="pfoot">
        <span><span className="k">SHARED UNDER YOUR NAME</span></span>
        <span>STAY IN EVERY FILE →</span>
      </div>
    </div>
  )
}

/* ── Cards + charts ──────────────────────────────────────────────────────── */

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

/** Owner — balance falling, equity rising, gold area. */
function PayoffChart() {
  const equity = '8,104 70,92 132,72 194,48 256,28 312,14'
  const balance = '8,18 70,30 132,52 194,74 256,92 312,104'
  return (
    <svg viewBox="0 0 320 122" role="img" aria-label="Projected equity rising as the balance falls">
      {[30, 60, 90].map((y) => (
        <line key={y} x1="8" y1={y} x2="312" y2={y} style={{ stroke: 'var(--color-surface-50)', opacity: 0.07 }} strokeWidth="1" />
      ))}
      <polygon points={`${equity} 312,116 8,116`} style={{ fill: 'var(--color-accent-400)', opacity: 0.18 }} />
      <polyline points={equity} fill="none" style={{ stroke: 'var(--color-accent-400)' }} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={balance} fill="none" style={{ stroke: 'var(--color-surface-50)', opacity: 0.4 }} strokeWidth="1.5" strokeDasharray="3 3" strokeLinejoin="round" />
      <circle cx="312" cy="14" r="3.5" style={{ fill: 'var(--color-accent-400)' }} />
    </svg>
  )
}

/** Buyer — net worth climbing. No loan yet, so no falling balance line. */
function RiseChart() {
  const worth = '8,106 70,90 132,74 194,52 256,30 312,12'
  return (
    <svg viewBox="0 0 320 122" role="img" aria-label="Projected net worth climbing as you prepare to buy">
      {[30, 60, 90].map((y) => (
        <line key={y} x1="8" y1={y} x2="312" y2={y} style={{ stroke: 'var(--color-surface-50)', opacity: 0.07 }} strokeWidth="1" />
      ))}
      <polygon points={`${worth} 312,116 8,116`} style={{ fill: 'var(--color-accent-400)', opacity: 0.18 }} />
      <polyline points={worth} fill="none" style={{ stroke: 'var(--color-accent-400)' }} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="312" cy="12" r="3.5" style={{ fill: 'var(--color-accent-400)' }} />
    </svg>
  )
}

/** Advisor — years pulled forward across the roster, one bar per client. */
function BarsChart() {
  const bars = [44, 62, 38, 78, 56, 70]
  const n = bars.length
  const gap = 12
  const bw = (304 - gap * (n - 1)) / n
  return (
    <svg viewBox="0 0 320 122" role="img" aria-label="Years pulled forward across your client roster">
      {[30, 60, 90].map((y) => (
        <line key={y} x1="8" y1={y} x2="312" y2={y} style={{ stroke: 'var(--color-surface-50)', opacity: 0.07 }} strokeWidth="1" />
      ))}
      {bars.map((h, i) => (
        <rect
          key={i}
          x={8 + i * (bw + gap)}
          y={110 - h}
          width={bw}
          height={h}
          rx="1.5"
          style={{ fill: 'var(--color-accent-400)', opacity: i === 3 ? 1 : 0.5 }}
        />
      ))}
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

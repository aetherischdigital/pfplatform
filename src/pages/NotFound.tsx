import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './preview/statement.css'

const SUGGESTIONS: { to: string; label: string; sub: string }[] = [
  { to: '/how-it-works', label: 'How it works', sub: 'The method in five tools.' },
  { to: '/calculator', label: 'Calculator', sub: 'Your payoff date in 60 seconds — no signup.' },
  { to: '/pricing', label: 'Pricing', sub: 'Free today; paid tiers in the works.' },
  { to: '/blog', label: 'Blog', sub: 'Plain-English deep dives on payoff math.' },
  { to: '/about', label: 'About', sub: 'Why we built this.' },
]

export default function NotFound() {
  const { pathname } = useLocation()

  // Fire-and-forget GA event so we can spot dead-link patterns without a
  // separate error-tracking SDK. No-op outside production where gtag isn't wired.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as unknown as { gtag?: (...args: unknown[]) => void }
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'page_not_found', {
        path: pathname,
        referrer: document.referrer || '(direct)',
      })
    }
  }, [pathname])

  return (
    <div className="stmt">
      <section className="stmt-section" style={{ textAlign: 'center', paddingTop: 76 }}>
        <div className="stmt-wrap" style={{ maxWidth: 640 }}>
          <span className="stmt-label">Error 404 · off the ledger</span>
          <div
            className="stmt-display"
            style={{ fontSize: 'clamp(72px, 12vw, 150px)', lineHeight: 0.9, fontWeight: 700, marginTop: 16, color: 'var(--gold-deep)' }}
          >
            404
          </div>
          <h1 className="stmt-display stmt-h2" style={{ marginTop: 6 }}>
            That page isn&rsquo;t on the ledger.
          </h1>
          <p className="stmt-sub" style={{ margin: '16px auto 0', maxWidth: '34em' }}>
            We couldn&rsquo;t find{' '}
            <code className="stmt-mono" style={{ background: 'var(--color-surface-100)', padding: '2px 7px', borderRadius: 3, fontSize: 14 }}>
              {pathname}
            </code>
            . It may have moved, or never existed — the entries we do keep are below.
          </p>
          <div className="stmt-cta" style={{ justifyContent: 'center', marginTop: 28 }}>
            <Link to="/" className="stmt-btn stmt-btn--gold">
              Back to home <ArrowRight size={16} />
            </Link>
          </div>

          <div className="stmt-plate" style={{ maxWidth: 520, margin: '48px auto 0', textAlign: 'left' }}>
            <div className="phead"><span className="t">Pages on the ledger</span><span className="m">INDEX</span></div>
            {SUGGESTIONS.map((s) => (
              <Link key={s.to} to={s.to} className="stmt-pline">
                <span className="lbl">{s.label}<span className="sub">{s.sub}</span></span>
                <span className="val"><ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

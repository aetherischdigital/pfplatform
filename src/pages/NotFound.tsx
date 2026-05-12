import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Compass } from 'lucide-react'
import Container from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'

const SUGGESTIONS: { to: string; label: string; sub: string }[] = [
  { to: '/how-it-works', label: 'How it works', sub: 'The methodology in five tools.' },
  { to: '/calculator', label: 'Calculator', sub: 'Your payoff date in 60 seconds — no signup.' },
  { to: '/pricing', label: 'Pricing', sub: 'Free today; paid tiers in the works.' },
  { to: '/blog', label: 'Blog', sub: 'Plain-English deep dives on payoff math.' },
  { to: '/about', label: 'About', sub: 'Why we built this.' },
]

export default function NotFound() {
  const { pathname } = useLocation()

  // Fire-and-forget GA event so we can spot dead-link patterns
  // (typo'd URLs, removed routes, scraper traffic, etc.) without a separate
  // error-tracking SDK. No-op outside production where gtag isn't wired up.
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
    <Container className="py-24 sm:py-32">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-100 text-accent-600">
          <Compass size={20} />
        </div>
        <p className="mt-5 font-mono text-xs uppercase tracking-wider text-accent-600">404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-surface-900 sm:text-5xl">
          That page isn&rsquo;t on the ledger.
        </h1>
        <p className="mt-4 text-surface-600">
          We couldn&rsquo;t find{' '}
          <code className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-sm text-surface-900">
            {pathname}
          </code>
          . It may have moved, or never existed. The pages we do track are below.
        </p>
        <div className="mt-7 flex justify-center">
          <ButtonLink to="/" variant="primary" size="lg">
            Back to home <ArrowRight size={16} />
          </ButtonLink>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-2xl">
        <ul className="divide-y divide-surface-200 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card">
          {SUGGESTIONS.map((s) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-50 focus-visible:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400"
              >
                <div className="min-w-0">
                  <div className="font-display text-base font-semibold text-surface-900">
                    {s.label}
                  </div>
                  <div className="mt-0.5 text-sm text-surface-500">{s.sub}</div>
                </div>
                <ArrowRight
                  size={16}
                  className="flex-shrink-0 text-surface-400 transition-colors group-hover:text-surface-900"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  )
}

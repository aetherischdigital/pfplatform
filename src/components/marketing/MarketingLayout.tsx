import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function MarketingLayout() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      // Defer one tick so the route content has mounted before we look up the
      // target element. Falls back to top-of-page if the id isn't present.
      const id = hash.slice(1)
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' })
          return
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      })
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-surface-50 font-body text-surface-900">
      {/* Shared paper atmosphere — warm wash + fine grain — so every public page
          lives in the same "statement" world. Token-driven; themes light/dark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(90% 55% at 100% 0%, color-mix(in srgb, var(--color-accent-400) 11%, transparent), transparent 55%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          mixBlendMode: 'soft-light',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-card-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

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
    <div className="flex min-h-screen flex-col bg-white text-surface-900">
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

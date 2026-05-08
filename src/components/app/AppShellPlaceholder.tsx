import { Outlet, Link } from 'react-router-dom'
import Wordmark from '../Wordmark'

export default function AppShellPlaceholder() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <header className="border-b border-surface-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Wordmark size="md" />
          <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-600">
            Authenticated section — not yet wired
          </span>
          <Link to="/" className="text-sm text-surface-500 hover:text-surface-900">
            ← Back to site
          </Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

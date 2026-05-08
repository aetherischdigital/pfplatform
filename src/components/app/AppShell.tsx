import { useState } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { Home, FileText, Calculator, User, LogOut, Menu, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Wordmark from '../Wordmark'
import ThemeToggle from '../ThemeToggle'
import { MOCK_PROFILE } from '../../lib/mockData'

type NavItem = { to: string; label: string; icon: LucideIcon }

const navItems: NavItem[] = [
  { to: '/app/dashboard', label: 'Dashboard', icon: Home },
  { to: '/app/financials', label: 'Financials', icon: FileText },
  { to: '/calculator', label: 'Calculator', icon: Calculator },
  { to: '/app/account', label: 'Account', icon: User },
]

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen bg-surface-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r border-surface-200 bg-white md:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between border-b border-surface-200 bg-white px-4 md:hidden">
          <Wordmark size="sm" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              className="text-surface-700"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-surface-900/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <aside
              className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-card-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <main key={pathname} className="flex-1">
          <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-surface-200 px-4 py-4">
        <Wordmark size="md" />
        <ThemeToggle />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-surface-900 text-white'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-surface-200 p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-100 text-sm font-medium text-accent-600">
            {MOCK_PROFILE.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-surface-900">
              {MOCK_PROFILE.name}
            </div>
            <div className="truncate text-xs text-surface-500">{MOCK_PROFILE.email}</div>
          </div>
          <Link
            to="/"
            className="text-surface-400 hover:text-surface-700"
            title="Sign out (placeholder)"
            onClick={onNavigate}
          >
            <LogOut size={16} />
          </Link>
        </div>
      </div>
    </>
  )
}

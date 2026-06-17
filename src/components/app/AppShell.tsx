import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  FileText,
  Building2,
  Calculator,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Eye,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Wordmark from '../Wordmark'
import ThemeToggle from '../ThemeToggle'
import { useAuth } from '../../lib/useAuth'
import { useModalDismiss } from '../../lib/useModalDismiss'
import { homePathFor, type UserRole } from '../../lib/profile'

type NavItem = { to: string; label: string; icon: LucideIcon }

function navItemsFor(role: UserRole | null): NavItem[] {
  const items: NavItem[] = [
    { to: '/app/dashboard', label: 'Dashboard', icon: Home },
    { to: '/app/financials', label: 'Financials', icon: FileText },
    { to: '/app/properties', label: 'Properties', icon: Building2 },
    { to: '/app/calculators', label: 'Calculators', icon: Calculator },
  ]
  if (role === 'advisor') {
    items.push({ to: '/app/clients', label: 'Clients', icon: Users })
  }
  items.push({ to: '/app/account', label: 'Account', icon: User })
  return items
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const drawerRef = useRef<HTMLElement>(null)
  const closeDrawer = useCallback(() => setMobileOpen(false), [])

  // Escape-to-close + Tab focus-trap + scroll-lock for the mobile drawer, so it
  // behaves like every other modal surface in the app rather than leaking focus
  // to the page behind the scrim.
  useModalDismiss(mobileOpen, closeDrawer, drawerRef)

  // Auto-close the mobile drawer when the viewport crosses Tailwind's md
  // breakpoint (768px). Otherwise rotating an iPhone to landscape leaves the
  // drawer mounted behind the desktop sidebar, still trapping focus.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => {
      if (mq.matches) setMobileOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className="flex min-h-screen bg-surface-50">
      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-card-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
      >
        Skip to content
      </a>
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
              className="rounded-md p-1 text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-surface-900/50 animate-fade-in md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden={!mobileOpen}
          >
            <aside
              ref={drawerRef}
              className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-card-lg animate-slide-in-left"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <main id="app-main" key={pathname} className="flex-1">
          <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, profile, profileLoading, effectiveRole, signOut } = useAuth()
  const navigate = useNavigate()

  const fullName =
    profile?.displayName ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    ''
  const email = user?.email ?? ''
  const initial = (fullName[0] ?? '').toUpperCase()
  const showSkeleton = profileLoading || (!fullName && !email)

  const items = navItemsFor(effectiveRole)
  const showAdminSection = profile?.role === 'admin' && effectiveRole === 'admin'

  const handleSignOut = async () => {
    await signOut()
    onNavigate?.()
    navigate('/')
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-surface-200 px-4 py-4">
        <Wordmark size="md" compact />
        <ThemeToggle />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-500 text-surface-50'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}

        {showAdminSection && <AdminSection onNavigate={onNavigate} />}
      </nav>
      <div className="border-t border-surface-200 p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-accent-100 text-sm font-medium text-accent-600">
            {showSkeleton ? (
              <span className="h-3 w-3 animate-pulse rounded-full bg-accent-200" aria-hidden />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            {showSkeleton ? (
              <>
                <div className="h-3.5 w-20 animate-pulse rounded bg-surface-100" />
                <div className="mt-1 h-3 w-28 animate-pulse rounded bg-surface-100" />
              </>
            ) : (
              <>
                <div className="truncate text-sm font-medium text-surface-900">
                  {fullName || 'You'}
                </div>
                <div className="truncate text-xs text-surface-500">{email}</div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-surface-400 transition-colors hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 rounded-md p-1"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

function AdminSection({ onNavigate }: { onNavigate?: () => void }) {
  const { setViewAs } = useAuth()
  const navigate = useNavigate()

  const enterViewAs = (role: UserRole) => {
    setViewAs(role)
    onNavigate?.()
    navigate(homePathFor(role))
  }

  // Each admin surface gets its own sidebar entry so the section grows
  // gracefully as we add more tools (billing, audit logs, etc.). The umbrella
  // "Admin" link is gone — /admin IS the users page, so it's labeled that way.
  // `end` on the Users NavLink prevents it from staying highlighted while the
  // user is on a /admin/<sub> route.
  const adminLinks: NavItem[] = [
    { to: '/admin', label: 'Users', icon: Users },
    { to: '/admin/blog', label: 'Blog', icon: FileText },
  ]

  return (
    <div className="mt-6 border-t border-surface-200 pt-4">
      <div className="flex items-center gap-1.5 px-3 pb-2 font-label text-[11px] uppercase tracking-[0.22em] text-accent-600">
        <Shield size={12} /> Admin tools
      </div>
      {adminLinks.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
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

      <div className="mt-3 rounded-md border border-surface-200 bg-surface-50 p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-surface-600">
          <Eye size={12} /> View as
        </div>
        <p className="mt-1 text-xs leading-snug text-surface-500">
          Preview the app as another role. Your admin session stays active.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => enterViewAs('homeowner')}
            className="rounded-md border border-surface-200 bg-white px-2 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
          >
            Homeowner
          </button>
          <button
            type="button"
            onClick={() => enterViewAs('advisor')}
            className="rounded-md border border-surface-200 bg-white px-2 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
          >
            Advisor
          </button>
        </div>
      </div>
    </div>
  )
}

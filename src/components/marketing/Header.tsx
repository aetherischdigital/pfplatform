import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import Container from '../ui/Container'
import { Button, ButtonLink } from '../ui/Button'
import Wordmark from '../Wordmark'
import ThemeToggle from '../ThemeToggle'
import { useAuthModal } from '../../lib/authModal'
import { useAuth } from '../../lib/auth'

const links = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
]

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-surface-900' : 'text-surface-500 hover:text-surface-900'
  }`

export default function Header() {
  const [open, setOpen] = useState(false)
  const { openModal } = useAuthModal()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const signedIn = !!user

  const onSignIn = () => {
    setOpen(false)
    openModal('login')
  }
  const onStartFree = () => {
    setOpen(false)
    openModal('signup')
  }
  const onSignOut = async () => {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200 bg-white/90 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Wordmark size="md" />

          <nav className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClasses}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-1 md:flex">
            <ThemeToggle />
            <span className="mx-1 h-5 w-px bg-surface-200" aria-hidden />
            {signedIn ? (
              <>
                <ButtonLink to="/app/dashboard" variant="primary" size="sm">
                  <LayoutDashboard size={14} /> Dashboard
                </ButtonLink>
                <Button onClick={onSignOut} variant="ghost" size="sm" aria-label="Sign out">
                  <LogOut size={14} />
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onSignIn} variant="ghost" size="sm">Sign in</Button>
                <Button onClick={onStartFree} variant="primary" size="sm">Start free</Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="text-surface-700"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </Container>

      {open && (
        <div className="border-t border-surface-200 bg-white md:hidden">
          <Container className="py-4">
            <nav className="flex flex-col gap-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className="text-base font-medium text-surface-700"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                {signedIn ? (
                  <>
                    <ButtonLink to="/app/dashboard" variant="primary" size="md" onClick={() => setOpen(false)}>
                      <LayoutDashboard size={16} /> Dashboard
                    </ButtonLink>
                    <Button onClick={onSignOut} variant="secondary" size="md">
                      <LogOut size={16} /> Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={onSignIn} variant="secondary" size="md">Sign in</Button>
                    <Button onClick={onStartFree} variant="primary" size="md">Start free</Button>
                  </>
                )}
              </div>
            </nav>
          </Container>
        </div>
      )}
    </header>
  )
}

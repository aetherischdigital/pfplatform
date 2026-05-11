import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, User as UserIcon, Lock, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/useAuth'
import { fetchOwnProfile, type Profile } from '../../lib/profile'

export default function Account() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchOwnProfile()
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
          Account
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Profile, security, and subscription.
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="border-b border-surface-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-surface-900">Profile</h2>
        </header>
        <div className="space-y-1 p-6">
          <Field
            icon={UserIcon}
            label="Name"
            value={loading ? '…' : profile?.displayName || '—'}
          />
          <Field icon={Mail} label="Email" value={loading ? '…' : profile?.email ?? '—'} />
          <Field icon={Lock} label="Password" value="••••••••••" />
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-surface-200 px-6 py-4">
          <Button variant="secondary" size="sm" disabled>
            Edit profile
          </Button>
        </footer>
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="border-b border-surface-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-surface-900">Subscription</h2>
        </header>
        <div className="px-6 py-6 text-sm text-surface-500">
          No active subscription.
        </div>
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="border-b border-surface-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-surface-900">Session</h2>
        </header>
        <div className="flex items-center justify-between px-6 py-5">
          <div className="text-sm text-surface-600">
            Signed in as{' '}
            <span className="font-medium text-surface-900">{profile?.email ?? '…'}</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-md border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-900 hover:bg-surface-50"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </section>
    </div>
  )
}

function Field({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-surface-100 py-3 last:border-b-0">
      <Icon size={16} className="text-surface-400" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-surface-400">{label}</div>
        <div className="text-sm font-medium text-surface-900">{value}</div>
      </div>
    </div>
  )
}

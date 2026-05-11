import { Link } from 'react-router-dom'
import { LogOut, Mail, User as UserIcon, Lock } from 'lucide-react'
import { MOCK_PROFILE } from '../../lib/mockData'
import { Button } from '../../components/ui/Button'

export default function Account() {
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

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="border-b border-surface-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-surface-900">Profile</h2>
        </header>
        <div className="space-y-1 p-6">
          <Field icon={UserIcon} label="Name" value={MOCK_PROFILE.name} />
          <Field icon={Mail} label="Email" value={MOCK_PROFILE.email} />
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
            Signed in as <span className="font-medium text-surface-900">{MOCK_PROFILE.email}</span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-900 hover:bg-surface-50"
          >
            <LogOut size={14} />
            Sign out
          </Link>
        </div>
      </section>
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'

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

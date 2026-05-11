import { useNavigate } from 'react-router-dom'
import { Eye, ArrowRight } from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { homePathFor, type UserRole } from '../../lib/profile'
import { Button } from '../../components/ui/Button'

const VIEW_AS_OPTIONS: { role: UserRole; label: string; description: string }[] = [
  {
    role: 'homeowner',
    label: 'Homeowner',
    description: 'Lands on the dashboard with PFS, equity, and payoff projections.',
  },
  {
    role: 'realtor',
    label: 'Realtor',
    description: 'Lands on the clients roster (Phase 2 surface).',
  },
]

export default function Admin() {
  const { setViewAs, viewAsRole } = useAuth()
  const navigate = useNavigate()

  const enterViewAs = (role: UserRole) => {
    setViewAs(role)
    navigate(homePathFor(role))
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-surface-900">
          Admin
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          User management and site overview.
        </p>
      </header>

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="flex items-center gap-3 border-b border-surface-200 px-6 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-100 text-accent-600">
            <Eye size={16} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-surface-900">View as</h2>
            <p className="text-sm text-surface-500">
              Preview what a homeowner or realtor sees. Your session stays admin — data shown is
              your own.
            </p>
          </div>
        </header>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          {VIEW_AS_OPTIONS.map((opt) => (
            <div
              key={opt.role}
              className="flex flex-col rounded-xl border border-surface-200 bg-surface-50 p-5"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-base font-semibold text-surface-900">
                  {opt.label}
                </h3>
                {viewAsRole === opt.role && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-1 flex-1 text-sm text-surface-500">{opt.description}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => enterViewAs(opt.role)}
                className="mt-4"
              >
                View as {opt.label.toLowerCase()} <ArrowRight size={14} />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-surface-300 bg-white p-12 text-center text-sm text-surface-500">
        User list and site metrics — coming next.
      </section>
    </div>
  )
}

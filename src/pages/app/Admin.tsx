import { Link } from 'react-router-dom'
import { Shield, FileText, ArrowRight } from 'lucide-react'

export default function Admin() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-accent-600" />
          <h1 className="font-display text-2xl font-semibold tracking-tight text-surface-900">
            Admin
          </h1>
        </div>
        <p className="mt-1 text-sm text-surface-500">
          Tools that aren't part of the homeowner-side app.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminTile
          icon={FileText}
          title="Blog"
          body="Draft, schedule, and publish posts. Posts auto-publish on their scheduled time via pg_cron."
          to="/admin/blog"
        />
      </div>
    </div>
  )
}

function AdminTile({
  icon: Icon,
  title,
  body,
  to,
}: {
  icon: typeof FileText
  title: string
  body: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-card transition-shadow hover:shadow-card-lg"
    >
      <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-600">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-surface-900">{title}</h2>
          <ArrowRight
            size={14}
            className="text-surface-300 transition-colors group-hover:text-surface-900"
          />
        </div>
        <p className="mt-1 text-sm text-surface-500">{body}</p>
      </div>
    </Link>
  )
}

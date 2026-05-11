import { Shield } from 'lucide-react'

export default function Admin() {
  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-accent-600" />
          <h1 className="font-display text-2xl font-semibold tracking-tight text-surface-900">
            Admin
          </h1>
        </div>
        <p className="mt-1 text-sm text-surface-500">
          User management and site overview.
        </p>
      </header>

      <section className="rounded-2xl border border-dashed border-surface-300 bg-white p-12 text-center text-sm text-surface-500">
        User list and site metrics — coming next.
      </section>
    </div>
  )
}

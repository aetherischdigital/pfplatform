import { Users } from 'lucide-react'

export default function Clients() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
          Clients
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Your homeowner roster — invitations, plans, and reminders.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-surface-300 bg-white p-12 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-100 text-accent-600">
          <Users size={20} />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold text-surface-900">
          Realtor surface lands in Phase 2
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-surface-500">
          Invite clients with one link, view their plans with permission, and send branded
          after-closing touchpoints — all coming with the next release.
        </p>
      </div>
    </div>
  )
}

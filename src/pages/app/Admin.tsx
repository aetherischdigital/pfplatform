import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Search, Shield, UserX, UserCheck } from 'lucide-react'
import { useAuth } from '../../lib/useAuth'
import { listUsers, setUserActive, updateUserRole, type AdminUser } from '../../lib/admin'
import type { UserRole } from '../../lib/profile'
import { Button } from '../../components/ui/Button'

type Filter = 'all' | UserRole

export default function Admin() {
  const { user: authUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(() => {
    return listUsers()
      .then((data) => {
        setUsers(data)
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load users.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    listUsers()
      .then((data) => {
        if (!cancelled) setUsers(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load users.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    const c = {
      total: users.length,
      homeowner: 0,
      realtor: 0,
      admin: 0,
      inactive: 0,
      plus: 0,
      pro: 0,
    }
    for (const u of users) {
      c[u.role] += 1
      if (!u.isActive) c.inactive += 1
      if (u.waitlistInterest === 'plus') c.plus += 1
      else if (u.waitlistInterest === 'pro') c.pro += 1
    }
    return c
  }, [users])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (q && !(u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q))) {
        return false
      }
      return true
    })
  }, [users, query, roleFilter])

  const handleRoleChange = async (target: AdminUser, newRole: UserRole) => {
    if (newRole === target.role) return
    if (target.id === authUser?.id && newRole !== 'admin') {
      setError('You cannot demote your own account.')
      return
    }
    setBusyId(target.id)
    setError(null)
    try {
      await updateUserRole(target.id, newRole)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role change failed.')
    } finally {
      setBusyId(null)
    }
  }

  const handleActiveToggle = async (target: AdminUser) => {
    if (target.id === authUser?.id && target.isActive) {
      setError('You cannot deactivate your own account.')
      return
    }
    setBusyId(target.id)
    setError(null)
    try {
      await setUserActive(target.id, !target.isActive)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setBusyId(null)
    }
  }

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CountCard label="Total users" value={counts.total} />
        <CountCard label="Homeowners" value={counts.homeowner} />
        <CountCard label="Realtors" value={counts.realtor} />
        <CountCard label="Admins" value={counts.admin} accent />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CountCard label="Waiting on Plus" value={counts.plus} />
        <CountCard label="Waiting on Pro" value={counts.pro} />
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="flex flex-col gap-3 border-b border-surface-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email or name…"
              className="w-full rounded-md border border-surface-200 bg-surface-50 py-2 pl-9 pr-3 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Filter)}
            className="rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-surface-400"
          >
            <option value="all">All roles</option>
            <option value="homeowner">Homeowners</option>
            <option value="realtor">Realtors</option>
            <option value="admin">Admins</option>
          </select>
        </header>

        {loading ? (
          <div className="p-10 text-center text-sm text-surface-500">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-surface-500">No users match.</div>
        ) : (
          <>
            <ul className="divide-y divide-surface-200 md:hidden">
              {filtered.map((u) => {
                const isSelf = u.id === authUser?.id
                return (
                  <li
                    key={u.id}
                    className={`space-y-3 p-4 ${u.isActive ? '' : 'bg-surface-50/50 opacity-75'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 font-medium text-surface-900">
                          {u.displayName || u.email?.split('@')[0] || 'Unnamed'}
                          {isSelf && (
                            <span className="rounded bg-accent-100 px-1.5 py-0.5 text-xs font-medium text-accent-700">
                              You
                            </span>
                          )}
                          {u.waitlistInterest !== 'none' && (
                            <WaitlistChip interest={u.waitlistInterest} />
                          )}
                        </div>
                        <div className="truncate text-xs text-surface-500">{u.email ?? '—'}</div>
                      </div>
                      {u.isActive ? (
                        <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-surface-500">
                        Role
                      </label>
                      <select
                        value={u.role}
                        disabled={busyId === u.id || isSelf}
                        onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                        className="flex-1 rounded-md border border-surface-200 bg-white px-2 py-1 text-sm text-surface-900 outline-none focus:border-surface-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="homeowner">Homeowner</option>
                        <option value="realtor">Realtor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-surface-500">
                      <span>Joined {formatDate(u.createdAt)}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busyId === u.id || isSelf}
                        onClick={() => handleActiveToggle(u)}
                        title={isSelf ? 'Cannot change own status' : undefined}
                      >
                        {u.isActive ? (
                          <>
                            <UserX size={14} /> Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck size={14} /> Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-surface-200 bg-surface-50 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200">
                  {filtered.map((u) => {
                    const isSelf = u.id === authUser?.id
                    return (
                      <tr key={u.id} className={u.isActive ? '' : 'bg-surface-50/50 opacity-75'}>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2 font-medium text-surface-900">
                            {u.displayName || u.email?.split('@')[0] || 'Unnamed'}
                            {isSelf && (
                              <span className="rounded bg-accent-100 px-1.5 py-0.5 text-xs font-medium text-accent-700">
                                You
                              </span>
                            )}
                            {u.waitlistInterest !== 'none' && (
                              <WaitlistChip interest={u.waitlistInterest} />
                            )}
                          </div>
                          <div className="text-xs text-surface-500">{u.email ?? '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            disabled={busyId === u.id || isSelf}
                            onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                            className="rounded-md border border-surface-200 bg-white px-2 py-1 text-sm text-surface-900 outline-none focus:border-surface-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="homeowner">Homeowner</option>
                            <option value="realtor">Realtor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-surface-600">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busyId === u.id || isSelf}
                            onClick={() => handleActiveToggle(u)}
                            title={isSelf ? 'Cannot change own status' : undefined}
                          >
                            {u.isActive ? (
                              <>
                                <UserX size={14} /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} /> Activate
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function WaitlistChip({ interest }: { interest: 'plus' | 'pro' }) {
  return (
    <span className="inline-flex items-center rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-600">
      {interest}
    </span>
  )
}

function CountCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-semibold tracking-tight ${
          accent ? 'text-accent-600' : 'text-surface-900'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

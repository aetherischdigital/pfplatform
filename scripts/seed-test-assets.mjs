// One-off: seed two assets on the test homeowner so we can screenshot the
// dashboard's "has data but no mortgage" state. Delete the rows after.
//
// Usage:
//   node scripts/seed-test-assets.mjs add
//   node scripts/seed-test-assets.mjs remove

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(resolve(here, '..', '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const supa = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await supa.auth.admin.listUsers()
if (error) throw error
const t = data.users.find((u) => u.email === 'test@pfplatform.app')
if (!t) throw new Error('test@pfplatform.app not found')
console.log('test user id:', t.id)

const mode = process.argv[2] ?? 'add'

if (mode === 'add') {
  const { data: rows, error: err } = await supa
    .from('pfs_records')
    .insert([
      {
        user_id: t.id,
        kind: 'asset',
        label: 'Primary residence',
        category: 'real_estate',
        amount: 450000,
      },
      { user_id: t.id, kind: 'asset', label: 'Checking', category: 'cash', amount: 12000 },
    ])
    .select()
  if (err) throw err
  console.log('inserted', rows.length, 'rows')
} else if (mode === 'remove') {
  const { error: err, count } = await supa
    .from('pfs_records')
    .delete({ count: 'exact' })
    .eq('user_id', t.id)
  if (err) throw err
  console.log('deleted', count, 'rows')
} else {
  console.error('unknown mode:', mode)
  process.exit(1)
}

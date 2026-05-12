# Auth email templates

Branded HTML templates for the three auth emails Supabase sends. Designed to
match the marketing site: deep moss header strip, white card, walnut accent.

| File | Used for | Subject |
|---|---|---|
| `confirmation.html` | Signup email-verification | `Confirm your Personal Financial Platform account` |
| `recovery.html` | Password reset link | `Reset your Personal Financial Platform password` |
| `email_change.html` | Email-change confirmation | `Confirm your new email — Personal Financial Platform` |

## How to apply (production)

The `[auth.email.template.*]` blocks in `supabase/config.toml` reference these
files. To push them to the live project, from `app/`:

```sh
npx supabase config push --yes
```

That command syncs the entire `config.toml` to remote — not just the
templates. The CLI prints a diff and waits for confirmation (`--yes` accepts
it). Before running, **read the diff**: any setting in `config.toml` that
diverges from production will be overwritten too. In particular, the
default config.toml ships with values appropriate for `supabase start` (e.g.
`enable_confirmations = false`, `site_url = "http://127.0.0.1:3000"`) that
would break production if pushed verbatim. The auth section in our
`config.toml` has been hand-tuned to production values:

- `site_url = "https://pfplatform.app"`
- `enable_confirmations = true`
- `otp_length = 8`
- `max_frequency = "1m0s"`
- MFA TOTP `enroll_enabled` + `verify_enabled` = `true`

If you change any of those, you change production. Push only with eyes open.

The templates use the standard Supabase variables:

- `{{ .ConfirmationURL }}` — the action link (one-hour expiry)
- `{{ .Email }}` — the recipient's current email
- `{{ .NewEmail }}` — the requested new email (email_change only)

## Editing

These are intentionally **inline-styled table layouts**. No external CSS, no
custom fonts loaded (Inter falls back to system fonts in clients that won't
load web fonts). Brand colors are hard-coded hex so they survive every email
client. When the brand palette changes, search for the hex values in all
three files:

- `#1E2A1D` deep moss (header bg, primary button, text)
- `#B89571` walnut accent (wordmark dot, PFP mark)
- `#FAF7F0` cream surface (page bg)
- `#FFFFFF` white card
- `#E4DCC9` border / divider
- `#3A4A38` body text
- `#5F6F5A` muted text / small print
- `#5C4628` link color (inline URL fallback)

After editing, the dashboard is the deployment step — there's no `db push`
equivalent for these templates today.

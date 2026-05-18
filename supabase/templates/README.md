# Auth email templates

Branded HTML templates for the auth emails Supabase sends. Designed to match
the marketing site: deep moss header strip, white card, walnut accent.

## Live — transactional emails the app sends in Phase 1

| File | Used for | Subject |
|---|---|---|
| `confirmation.html` | Signup email-verification | `Confirm your Personal Financial Platform account` |
| `recovery.html` | Password reset link | `Reset your Personal Financial Platform password` |
| `email_change.html` | Email-change confirmation | `Confirm your new email — Personal Financial Platform` |

## Wired — security notification

| File | Used for | Subject | Status |
|---|---|---|---|
| `password_changed.html` | Security notice sent after a password change | `Your Personal Financial Platform password was changed` | Enabled in `config.toml` (`[auth.email.notification.password_changed]`). Goes live on production with `npx supabase config push` — notification emails are **not** editable in the dashboard's Email Templates UI. |

## Authored ahead — NOT yet wired (flows ship in Phase 2)

These two are brand-ready, but the flows that send them are not built yet. Do
not wire them up until the matching feature ships, and re-confirm Supabase's
template type, variables, and enablement at that time — the notification-email
family in particular varies between Supabase versions.

| File | Used for | Suggested subject | Blocked on |
|---|---|---|---|
| `invite.html` | Admin-invited user accepts an invitation | `You're invited to Personal Financial Platform` | Invite flow (`inviteUserByEmail`) — not built |
| `mfa_changed.html` | Security notice when a 2FA method is added or removed | `Your Personal Financial Platform two-factor settings changed` | MFA enrollment UI — Phase 2+ (see the `[auth.mfa.totp]` note in `config.toml`) |

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

- `{{ .ConfirmationURL }}` — the action link (used by `confirmation`, `recovery`,
  `email_change`, and `invite`)
- `{{ .Email }}` — the recipient's current email
- `{{ .NewEmail }}` — the requested new email (`email_change` only)

`password_changed.html` and `mfa_changed.html` use **no template variables** —
they are deliberately fully static, so they render correctly regardless of what
the notification-email system exposes when they are eventually wired up.

## Editing

These are intentionally **inline-styled table layouts**. No external CSS, no
custom fonts loaded (Inter falls back to system fonts in clients that won't
load web fonts). Brand colors are hard-coded hex so they survive every email
client. When the brand palette changes, search for the hex values in all
six files:

- `#1E2A1D` deep moss (header bg, primary button, text)
- `#B89571` walnut accent (wordmark dot, PFP mark)
- `#FAF7F0` cream surface (page bg)
- `#FFFFFF` white card
- `#E4DCC9` border / divider
- `#3A4A38` body text
- `#5F6F5A` muted text / small print
- `#5C4628` link color (inline URL fallback)

The support email `info@pfplatform.app` is hard-coded in `password_changed.html`
and `mfa_changed.html` — a security notice needs a "contact us" address and
Supabase exposes no variable for it. Update it in those two files if
`BRAND.supportEmail` ever changes.

After editing, the dashboard is the deployment step — there's no `db push`
equivalent for these templates today.

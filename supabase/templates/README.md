# Auth email templates

Branded HTML templates for the three auth emails Supabase sends. Designed to
match the marketing site: deep moss header strip, white card, walnut accent.

| File | Used for | Subject (recommended) |
|---|---|---|
| `confirmation.html` | Signup email-verification | `Confirm your Personal Financial Platform account` |
| `recovery.html` | Password reset link | `Reset your Personal Financial Platform password` |
| `email_change.html` | Email-change confirmation | `Confirm your new email — Personal Financial Platform` |

## How to apply (production)

The Supabase **dashboard** is the source of truth for production email
templates — the CLI's `[auth.email.template.*]` blocks only configure the
local dev instance. Paste each template into the matching field in
Supabase Studio:

1. Go to **Authentication → Email Templates** in the Supabase dashboard.
2. For each of:
   - **Confirm signup** ← paste `confirmation.html`
   - **Reset password** ← paste `recovery.html`
   - **Change email address** ← paste `email_change.html`
3. Set the subject lines from the table above.
4. Save each. Changes are live immediately — test with a real signup +
   password reset to verify rendering across Gmail / iOS Mail / Outlook.

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

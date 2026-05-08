# Project conventions for Claude

Notes that should persist across Claude Code sessions in this repo.

## Repo scope

This repo (`pfplatform`) contains only the website. The user typically launches Claude Code from the parent folder one level up (`Personal_finance_site/`) so they can reference proposal, contract, and planning docs alongside the code — but those parent-level files (`proposal/`, `planning/`, `client-assets/`, etc.) are private workspace materials and must never be committed here. Anything you stage or commit must be inside `app/` (this directory).

## Git / GitHub

- **GitHub account:** `aetherischdigital` (NOT `Aetherisch` / `aetherischen`).
- **SSH key:** `~/.ssh/id_ed25519_other`, surfaced via the `github-other` Host alias in `~/.ssh/config`. The `aetherischen` key is for a different account and must not be used for this repo.
- **Remote URL pattern:** `git@github-other:aetherischdigital/<repo>.git` — using the alias instead of `git@github.com` is what makes SSH pick the correct key automatically.
- **Local commit identity** (set via `git config --local`, scoped to this repo only — global identity is untouched):
  - `user.name` = `aetherischdigital`
  - `user.email` = `241678043+aetherischdigital@users.noreply.github.com`

## Stack

React (TypeScript) + Vite + Tailwind v4 (CSS `@theme` tokens), Supabase for auth/DB/edge functions, Cloudflare Pages for hosting/CDN. Single-domain app (marketing + member dashboards + admin all under one host).

## Brand

`src/config/brand.ts` is the single source of truth for the name, domain, and SEO copy. `src/styles/theme.css` holds the entire color palette (sage surface scale + walnut accent scale, light + dark). Don't hardcode hex values elsewhere.

## Secrets

`.env.local` holds local secrets (already gitignored via `*.local`). `.env.example` is the committed template. Production secrets for Supabase Edge Functions are managed via `supabase secrets set ...`, not in any committed file.

# Personal Financial Platform

Subscription-based personal-finance web app built around homeownership — a
homeowner dashboard, a Personal Financial Statement (PFS) data model, mortgage
payoff calculators, a realtor client roster, and an admin console, all served
from a single domain.

## Stack

- **React 19 + TypeScript**, bundled with **Vite**
- **Tailwind CSS v4** — CSS `@theme` tokens in `src/styles/theme.css`
- **React Router 7**
- **Supabase** — Postgres, Auth, and row-level security
- **Cloudflare Pages** — hosting + CDN, auto-deploy from `main`

## Prerequisites

- Node.js 22+
- A Supabase project (URL + anon key)

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev                  # http://localhost:5173
```

`.env.local` is gitignored — never commit real keys. `.env.example` is the
committed template and holds placeholders only.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production build in `dist/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src/
  components/   Reusable UI + feature components
  config/       Brand + site constants (single source of truth)
  lib/          Data access, auth, and pure helpers (Supabase, mortgage math)
  pages/        Route components — marketing/, app/ (authenticated), admin
  styles/       Tailwind theme tokens
supabase/
  migrations/   SQL migrations (apply with `npx supabase db push`)
public/         Static assets copied verbatim into the build
```

## Database

Schema changes live as timestamped SQL files in `supabase/migrations/` and are
applied to the linked Supabase project with `npx supabase db push`. Row-level
security is enabled on every table that holds user data.

## Deployment

`main` auto-deploys to Cloudflare Pages; every pull request gets its own
preview URL. `public/_redirects` routes all paths to `index.html` so the
client-side router handles deep links and refreshes.

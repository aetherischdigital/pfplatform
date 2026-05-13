/**
 * Manifest of public routes — used by the SEO file generators
 * (sitemap.xml, llms.txt). Add a route here when you add it to App.tsx
 * and want it discoverable.
 *
 * Authenticated routes (/app/*, /admin/*) and auth pages (/login, /signup)
 * are intentionally excluded — they're disallowed in robots.txt.
 */

export type Changefreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

export type PublicRoute = {
  path: string
  title: string
  description: string
  changefreq: Changefreq
  /** 0.0 – 1.0; relative importance for crawlers */
  priority: number
}

export const PUBLIC_ROUTES: PublicRoute[] = [
  {
    path: '/',
    title: 'Home',
    description: 'Pay off your home faster, build equity, and grow wealth.',
    changefreq: 'weekly',
    priority: 1.0,
  },
  {
    path: '/how-it-works',
    title: 'How it works',
    description: 'Detailed walkthrough of every tool on the platform.',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: '/calculator',
    title: 'Mortgage payoff calculator',
    description: 'Free interactive calculator — see your payoff date and interest savings.',
    changefreq: 'monthly',
    priority: 0.9,
  },
  {
    path: '/pricing',
    title: 'Pricing',
    description: 'Subscription tiers and feature comparison.',
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: '/blog',
    title: 'Blog',
    description: 'Educational articles on payoff strategies, equity, and homeownership.',
    changefreq: 'weekly',
    priority: 0.7,
  },
  {
    path: '/social',
    title: 'Social',
    description: 'Where to find us on Instagram, Facebook, and TikTok.',
    changefreq: 'monthly',
    priority: 0.4,
  },
  {
    path: '/about',
    title: 'About',
    description: 'Brand story, mission, and values.',
    changefreq: 'yearly',
    priority: 0.5,
  },
]

/**
 * Crawler-disallow list — these end up under `Disallow:` in robots.txt.
 * Keep auth, admin, and any in-progress sections out of search indexes.
 */
export const DISALLOWED_PATHS: string[] = ['/app/', '/admin/', '/login', '/signup']

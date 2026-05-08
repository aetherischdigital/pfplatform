/**
 * Single source of truth for the brand identity.
 * When the client confirms the real name and domain, change the values here
 * and every page, sitemap entry, robots.txt rule, and llms.txt block updates.
 *
 * Note: the static <title> in index.html is the only string that lives
 * outside this file (HTML is served before React boots). Update it too
 * when the real brand lands.
 */
export const BRAND = {
  name: 'Personal Financial Platform',
  /** Compact form used in tight UI (header on mobile, breadcrumbs, etc.) */
  shortName: 'PFPlatform',
  /** Bare domain — used in mockups and display */
  domain: 'pfplatform.app',
  /** Full canonical URL with protocol — used in sitemap, robots, OG tags */
  siteUrl: 'https://pfplatform.app',
  /** Short product positioning — used in <title>, og:title */
  headline: 'Pay off your home faster',
  /** One-line description — used in meta description, og:description */
  tagline: 'Personal finance built around homeownership.',
  legalName: 'Personal Financial Platform',
} as const

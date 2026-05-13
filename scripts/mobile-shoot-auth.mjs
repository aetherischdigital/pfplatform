// Mobile-viewport screenshots of authenticated surfaces. Signs in as the
// pre-seeded test users, navigates each route, captures full-page.
//
// Usage: node scripts/mobile-shoot-auth.mjs <baseUrl> <outDir>

import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const [baseUrl, outDir] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error('Usage: node scripts/mobile-shoot-auth.mjs <baseUrl> <outDir>')
  process.exit(1)
}
await mkdir(outDir, { recursive: true })

const PASSWORD = 'PfpDemo2026!'

// admin@ is the only seeded test account. To shoot other roles, either
// (a) re-seed the test/realtor accounts or (b) use the View-As feature
// from the admin sidebar and shoot manually.
const captures = [
  [
    'admin@pfplatform.app',
    [
      ['admin-dashboard', '/app/dashboard'],
      ['admin-financials', '/app/financials'],
      ['admin-calculators', '/app/calculators'],
      ['admin-account', '/app/account'],
      ['admin-page', '/admin'],
    ],
  ],
]

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox'],
})

async function signIn(page, email) {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle0' })
  // Open mobile menu, click "Sign in"
  await page.evaluate(() => {
    // Find any "Sign in" button/link on the page (mobile drawer or otherwise)
    const all = [...document.querySelectorAll('button, a')]
    const btn = all.find((el) => /sign in/i.test(el.textContent?.trim() ?? ''))
    if (btn) btn.click()
  })
  // If the click was on the hamburger we may need a second pass — wait briefly
  // and try again to ensure the modal opens.
  await new Promise((r) => setTimeout(r, 300))
  // Open mobile menu if Sign in not yet visible
  await page.evaluate(() => {
    if (!document.querySelector('input[type=email]')) {
      const btn = [...document.querySelectorAll('button')].find((el) =>
        /menu|sign/i.test(el.getAttribute('aria-label') ?? ''),
      )
      btn?.click()
    }
  })
  await page.waitForSelector('input[type=email]', { timeout: 5000 }).catch(() => {})
  // If still no email field, try opening the modal directly via path
  if (!(await page.$('input[type=email]'))) {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' })
  }
  await page.waitForSelector('input[type=email]', { timeout: 5000 })
  await page.type('input[type=email]', email, { delay: 10 })
  await page.type('input[type=password]', PASSWORD, { delay: 10 })
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15_000 }).catch(() => null),
    page.click('button[type=submit]'),
  ])
  await new Promise((r) => setTimeout(r, 800))
}

async function probeOverflow(page) {
  return page.evaluate(() => {
    const docW = document.documentElement.scrollWidth
    const viewW = window.innerWidth
    if (docW <= viewW + 1) return null
    let widest = null
    let maxRight = 0
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.right > maxRight && r.width > 0) {
        maxRight = r.right
        widest = el
      }
    }
    const path = []
    let cur = widest
    while (cur && cur !== document.body) {
      const id = cur.id ? `#${cur.id}` : ''
      const cls = (cur.className?.toString?.() ?? '').trim().split(/\s+/).slice(0, 2).join('.')
      path.unshift(`${cur.tagName.toLowerCase()}${id}${cls ? '.' + cls : ''}`)
      cur = cur.parentElement
    }
    return { docW, viewW, path: path.join(' > ') }
  })
}

try {
  for (const [email, routes] of captures) {
    const page = await browser.newPage()
    await page.emulate({
      viewport: {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
    console.log(`\n[${email}] signing in…`)
    try {
      await signIn(page, email)
      console.log(`[${email}] landed at ${page.url().replace(baseUrl, '')}`)
    } catch (e) {
      console.error(`[${email}] sign-in failed: ${e.message}`)
      await page.screenshot({ path: `${outDir}/_signin-fail-${email}.png`, fullPage: false })
      await page.close()
      continue
    }
    for (const [name, route] of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 30_000 })
      await new Promise((r) => setTimeout(r, 600))
      const overflow = await probeOverflow(page)
      await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
      console.log(
        `  ${route.padEnd(20)} ${overflow ? `OVERFLOW doc=${overflow.docW} view=${overflow.viewW} -> ${overflow.path}` : 'ok'}`,
      )
    }
    await page.close()
  }
} finally {
  await browser.close()
}

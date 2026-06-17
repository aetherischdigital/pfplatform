// Desktop-viewport screenshot of authenticated routes — desktop counterpart
// of mobile-shoot-auth.mjs.
//
// Usage: node scripts/desktop-shoot-auth.mjs <baseUrl> <outDir>

import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const [baseUrl, outDir] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error('Usage: node tmp/desktop-shoot-auth.mjs <baseUrl> <outDir>')
  process.exit(1)
}
await mkdir(outDir, { recursive: true })

const PASSWORD = 'PfpDemo2026!'
const EMAIL = 'admin@pfplatform.app'

const routes = [
  ['admin-dashboard', '/app/dashboard'],
  ['admin-financials', '/app/financials'],
  ['admin-calculators', '/app/calculators'],
  ['admin-account', '/app/account'],
  ['admin-page', '/admin'],
]

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox'],
})

async function signIn(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('input[type=email]', { timeout: 5000 })
  await page.type('input[type=email]', EMAIL, { delay: 10 })
  await page.type('input[type=password]', PASSWORD, { delay: 10 })
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15_000 }).catch(() => null),
    page.click('button[type=submit]'),
  ])
  await new Promise((r) => setTimeout(r, 800))
}

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  await signIn(page)
  for (const [name, route] of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 30_000 })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
    console.log(`${route.padEnd(20)} ok`)
  }
  await page.close()
} finally {
  await browser.close()
}

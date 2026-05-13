// Desktop-viewport screenshot harness for QA passes — desktop counterpart of
// mobile-shoot.mjs. Drives puppeteer-core against the existing Edge install.
//
// Usage: node scripts/desktop-shoot.mjs <baseUrl> <outDir>

import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const [baseUrl, outDir] = process.argv.slice(2)
if (!baseUrl || !outDir) {
  console.error('Usage: node tmp/desktop-shoot.mjs <baseUrl> <outDir>')
  process.exit(1)
}
await mkdir(outDir, { recursive: true })

const routes = [
  ['/', 'home'],
  ['/how-it-works', 'how-it-works'],
  ['/calculator', 'calculator'],
  ['/pricing', 'pricing'],
  ['/blog', 'blog'],
  ['/about', 'about'],
  ['/privacy', 'privacy'],
  ['/terms', 'terms'],
  ['/disclosures', 'disclosures'],
]

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox'],
})

try {
  for (const [route, name] of routes) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 30_000 })
    await new Promise((r) => setTimeout(r, 500))
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
    console.log(`${route.padEnd(18)} ok`)
    await page.close()
  }
} finally {
  await browser.close()
}

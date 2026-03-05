// Shared Playwright browser instance - lazy-loaded singleton.
// All connectors share one browser to avoid launching multiple Chromium processes

import type { Browser } from "playwright"
import { USER_AGENT } from "./utils"

let _browser: Browser | null = null
let _launching: Promise<Browser> | null = null

/**
 * Get (or create) the shared headless Chromium instance.
 * Callers should NOT close the browser, rather it's reused across requests
 */
export async function getBrowser(): Promise<Browser> {
  if (_browser?.isConnected()) return _browser

  if (_launching) return _launching

  _launching = (async () => {
    const { chromium } = await import("playwright")
    _browser = await chromium.launch({ headless: true })
    _browser.on("disconnected", () => {
      _browser = null
      _launching = null
    })
    return _browser
  })()

  return _launching
}

/**
 * Create a new browser context with defaults.
 * Each search gets its own context (separate cookies/state) but shares the browser.
 */
export async function newSearchContext() {
  const browser = await getBrowser()
  return browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
  })
}

// file: lib/connectors/utils.ts
// Shared utilities: rate limiter, retry, debug HTML saving, request headers.

import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import fs from "fs"
import path from "path"

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

export const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent": USER_AGENT,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
}

// ---------------------------------------------------------------------------
// Rate Limiter — enforces 1 request/sec per marketplace (in-memory)
// ---------------------------------------------------------------------------
class RateLimiter {
  private lastRequestTime: Record<string, number> = {}
  private minIntervalMs: number

  constructor(requestsPerSecond = 1) {
    this.minIntervalMs = 1000 / requestsPerSecond
  }

  async wait(key: string): Promise<void> {
    const now = Date.now()
    const last = this.lastRequestTime[key] ?? 0
    const elapsed = now - last
    if (elapsed < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed))
    }
    this.lastRequestTime[key] = Date.now()
  }
}

/** Singleton rate limiter — 1 request per second per marketplace key. */
export const rateLimiter = new RateLimiter(1)

// ---------------------------------------------------------------------------
// Retry with exponential backoff — retries on 429 / 5xx / timeouts
// ---------------------------------------------------------------------------
export async function fetchWithRetry(
  url: string,
  config: AxiosRequestConfig = {},
  maxRetries = 3,
): Promise<AxiosResponse> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios({
        url,
        timeout: 15_000,
        headers: { ...DEFAULT_HEADERS, ...config.headers },
        ...config,
      })
      return response
    } catch (error: any) {
      const status: number | undefined = error?.response?.status
      const isRetryable =
        status === 429 ||
        (status !== undefined && status >= 500) ||
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT"

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500
      console.warn(
        `[scrape] Retry ${attempt + 1}/${maxRetries} for ${url} (${status ?? error.code}) — waiting ${Math.round(delay)}ms`,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error("Unreachable")
}

// ---------------------------------------------------------------------------
// Debug HTML saving — controlled by DEBUG_SCRAPE=1 env variable
// ---------------------------------------------------------------------------
export function saveDebugHtml(marketplace: string, html: string): void {
  if (process.env.DEBUG_SCRAPE !== "1") return
  try {
    const dir = path.join(process.cwd(), "tmp")
    fs.mkdirSync(dir, { recursive: true })
    const filename = `${marketplace}-${Date.now()}.html`
    const snippet = html.substring(0, 100_000) // first 100 KB
    fs.writeFileSync(path.join(dir, filename), snippet, "utf-8")
    console.log(`[debug] Saved HTML to tmp/${filename}`)
  } catch (e) {
    console.warn("[debug] Failed to save HTML:", e)
  }
}

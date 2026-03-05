// file: lib/connectors/ebay.ts
// eBay connector — uses Playwright (eBay blocks plain HTTP with bot detection).
// Falls back to eBay Browse API when EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are set.

import { MarketplaceConnector, SearchQuery, Listing } from "./types"
import { rateLimiter, saveDebugHtml } from "./utils"
import { newSearchContext } from "./browser"

// ============================================================
// SELECTORS — update here when eBay changes their markup.
// As of 2025+, eBay uses `li.s-card` inside `ul.srp-results`.
// ============================================================
const SELECTORS = {
  // Each result card is a <li> inside ul.srp-results
  resultsList: "ul.srp-results",
  card: "ul.srp-results > li.s-card",
  // Inside each card
  link: "a",                    // first <a> contains the item URL
  image: "img",                 // first <img> in the card
} as const

// ============================================================
// eBay Browse API (optional, used when credentials are present)
// ============================================================
const EBAY_API_BASE = "https://api.ebay.com/buy/browse/v1"
const EBAY_AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token"
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAppToken(): Promise<string | null> {
  const clientId = process.env.EBAY_CLIENT_ID
  const clientSecret = process.env.EBAY_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value
  }
  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const res = await fetch(EBAY_AUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    })
    if (!res.ok) return null
    const data = await res.json()
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
    return cachedToken.value
  } catch {
    return null
  }
}

function mapApiCondition(id: string | undefined): string | undefined {
  const map: Record<string, string> = {
    "1000": "new", "1500": "new",
    "2000": "like_new", "2500": "like_new",
    "3000": "good", "4000": "good",
    "5000": "fair", "6000": "fair",
  }
  return id ? map[id] : undefined
}

async function searchViaApi(q: SearchQuery, limit: number): Promise<Listing[] | null> {
  const token = await getAppToken()
  if (!token) return null

  const query = buildQuery(q)
  const filters: string[] = ["buyingOptions:{FIXED_PRICE|AUCTION}"]
  if (q.maxPrice) filters.push(`price:[..${q.maxPrice}],priceCurrency:USD`)

  const url = new URL(`${EBAY_API_BASE}/item_summary/search`)
  url.searchParams.set("q", query)
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("filter", filters.join(","))

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.itemSummaries ?? []).map((item: Record<string, any>) => ({
      marketplace: "ebay" as const,
      listingId: String(item.itemId),
      title: String(item.title),
      price: parseFloat((item.price as { value: string }).value),
      currency: (item.price as { currency: string }).currency,
      condition: mapApiCondition(item.condition),
      url: String(item.itemWebUrl),
      imageUrl: item.image?.imageUrl ?? null,
      location: item.itemLocation
        ? `${item.itemLocation.city ?? ""}, ${item.itemLocation.stateOrProvince ?? ""}`.trim().replace(/^,\s*|,\s*$/, "")
        : null,
      postedAt: null,
      raw: item,
    }))
  } catch {
    return null
  }
}

// ============================================================
// Helpers
// ============================================================
function buildQuery(q: SearchQuery): string {
  return [q.brand, q.title, q.keywords, q.size ? `size ${q.size}` : null, q.color]
    .filter(Boolean)
    .join(" ")
}

function parsePrice(text: string): number | null {
  // Match a dollar sign followed by digits (with optional commas and decimal)
  const match = text.replace(/,/g, "").match(/\$([\d]+(?:\.[\d]{1,2})?)/)
  if (!match) return null
  const price = parseFloat(match[1])
  return Number.isFinite(price) && price > 0 ? price : null
}

function extractItemId(url: string): string | null {
  const match = url.match(/\/itm\/(\d+)/)
  return match ? match[1] : null
}

function mapScrapedCondition(text: string): string | undefined {
  const lower = text.toLowerCase()
  if (lower.includes("new")) return "new"
  if (lower.includes("open box") || lower.includes("like new")) return "like_new"
  if (lower.includes("pre-owned")) return "good"
  if (lower.includes("used") || lower.includes("fair")) return "fair"
  return undefined
}

// ============================================================
// Connector
// ============================================================
export const ebayConnector: MarketplaceConnector = {
  marketplace: "ebay",

  buildSearchUrl(q: SearchQuery): string {
    const query = encodeURIComponent(buildQuery(q))
    let url = `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_ItemCondition=3000`
    if (q.maxPrice) url += `&_udhi=${q.maxPrice}`
    return url
  },

  async search(q: SearchQuery, opts?: { limit?: number }): Promise<Listing[]> {
    const limit = opts?.limit ?? 20
    await rateLimiter.wait("ebay")

    // Try API first (most reliable when credentials exist)
    const apiResults = await searchViaApi(q, limit)
    if (apiResults && apiResults.length > 0) return apiResults

    // Scrape with Playwright (eBay blocks plain HTTP requests)
    const url = this.buildSearchUrl(q)
    let context: Awaited<ReturnType<typeof newSearchContext>> | undefined
    try {
      context = await newSearchContext()
      const page = await context.newPage()
      await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 })

      // Wait for result cards to render
      try {
        await page.waitForSelector(SELECTORS.card, { timeout: 8_000 })
      } catch {
        const content = await page.content()
        saveDebugHtml("ebay", content)
        return []
      }

      const rawItems = await page.$$eval(
        SELECTORS.card,
        (cards, max) => {
          return cards.slice(0, max).map(card => {
            const text = card.textContent?.trim() ?? ""
            const a = card.querySelector("a") as HTMLAnchorElement | null
            const img = card.querySelector("img") as HTMLImageElement | null
            return {
              text,
              href: a?.href ?? "",
              imgSrc: img?.src ?? null,
            }
          })
        },
        limit + 5, // grab a few extra to account for skipped items
      )

      const listings: Listing[] = []
      const seen = new Set<string>()

      for (const raw of rawItems) {
        if (listings.length >= limit) break

        const itemId = extractItemId(raw.href)
        if (!itemId || seen.has(itemId)) continue
        seen.add(itemId)

        // Parse the text blob: "Title...ConditionPrice..."
        // The card text contains title, condition, price, location all concatenated
        const text = raw.text
        const price = parsePrice(text)
        if (price === null) continue

        // Extract title: everything before the first occurrence of condition/price markers
        const titleEnd = text.search(/(?:Opens in|New|Pre-Owned|Used|Brand New|\$[\d])/i)
        const title = titleEnd > 0 ? text.substring(0, titleEnd).trim() : text.substring(0, 80).trim()
        if (!title) continue

        // Extract condition
        const condMatch = text.match(/(Brand New|New|Like New|Pre-Owned|Used|Open Box)/i)
        const condition = condMatch ? mapScrapedCondition(condMatch[1]) : undefined

        // Extract location — stop before coupon/promo text
        const locMatch = text.match(/Located in\s+(.+?)(?:\s*(?:Sponsored|\d+%\s*off|Free|Buy It)|\s*$)/i)
        const location = locMatch ? locMatch[1].trim().replace(/\s+/g, " ") : null

        listings.push({
          marketplace: "ebay",
          listingId: itemId,
          title,
          price,
          currency: "USD",
          url: raw.href.split("?")[0],
          imageUrl: raw.imgSrc,
          condition,
          location,
          postedAt: null,
          raw: { text: text.substring(0, 300) },
        })
      }

      return listings
    } catch (error) {
      console.error("[ebay] Playwright scraping failed:", error)
      saveDebugHtml("ebay", `ERROR: ${String(error)}`)
      return []
    } finally {
      await context?.close()
    }
  },
}

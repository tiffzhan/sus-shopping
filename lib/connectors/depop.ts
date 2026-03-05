// file: lib/connectors/depop.ts
// Depop connector — uses Playwright (Depop returns 403 to plain HTTP and is JS-rendered).
//
// Requires: npx playwright install chromium

import { MarketplaceConnector, SearchQuery, Listing } from "./types"
import { rateLimiter, saveDebugHtml } from "./utils"
import { newSearchContext } from "./browser"

// ============================================================
// SELECTORS — update here when Depop changes their markup.
// Depop product cards live inside <li> elements with a
// div.styles_productCardRoot__* wrapper. Each card has:
//   - an <a> linking to /products/SLUG/
//   - an <img> with the product photo
//   - text content with "$PRICE SIZE BRAND" concatenated
// ============================================================
const SELECTORS = {
  productLink: 'a[href*="/products/"]',
  // The parent <li> contains the full card (image + price + brand)
  cardContainer: "li",
} as const

// ============================================================
// Helpers
// ============================================================
function buildQuery(q: SearchQuery): string {
  return [q.brand, q.title, q.keywords, q.color].filter(Boolean).join(" ")
}

function parsePrice(text: string): number | null {
  // Depop shows prices like "$250.00 $169.99" (original + discounted)
  // Take the last price (current/discounted price)
  const matches = text.match(/[\$£€]([\d,.]+)/g)
  if (!matches || matches.length === 0) return null
  const lastPrice = matches[matches.length - 1].replace(/[^\d.]/g, "")
  return parseFloat(lastPrice)
}

function parseCurrency(text: string): string {
  if (text.includes("£")) return "GBP"
  if (text.includes("€")) return "EUR"
  return "USD"
}

// ============================================================
// Connector
// ============================================================
export const depopConnector: MarketplaceConnector = {
  marketplace: "depop",

  buildSearchUrl(q: SearchQuery): string {
    const query = encodeURIComponent(buildQuery(q))
    let url = `https://www.depop.com/search/?q=${query}`
    if (q.maxPrice) url += `&priceMax=${q.maxPrice}`
    return url
  },

  async search(q: SearchQuery, opts?: { limit?: number }): Promise<Listing[]> {
    const limit = opts?.limit ?? 20
    await rateLimiter.wait("depop")

    const url = this.buildSearchUrl(q)
    let context: Awaited<ReturnType<typeof newSearchContext>> | undefined

    try {
      context = await newSearchContext()
      const page = await context.newPage()
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 })

      // Wait for product cards to appear
      try {
        await page.waitForSelector(SELECTORS.productLink, { timeout: 10_000 })
      } catch {
        const content = await page.content()
        saveDebugHtml("depop", content)
        return []
      }

      // Brief wait for lazy-loaded images
      await page.waitForTimeout(2000)

      // Extract listings from the rendered DOM
      const rawListings = await page.$$eval(
        SELECTORS.productLink,
        (links, max) => {
          const results: Array<{
            listingId: string
            href: string
            text: string
            imgSrc: string | null
          }> = []
          const seen = new Set<string>()

          for (const el of links) {
            if (results.length >= max) break
            const a = el as HTMLAnchorElement
            const href = a.href ?? a.getAttribute("href") ?? ""
            const match = href.match(/\/products\/([^/?]+)/)
            if (!match) continue

            const productId = match[1]
            if (seen.has(productId)) continue
            seen.add(productId)

            // Walk up to the <li> card container
            const card = a.closest("li") ?? a.parentElement?.parentElement ?? a
            const text = card.textContent?.trim() ?? ""

            // Get the main product image
            const img = card.querySelector("img._mainImage_e5j9l_11, img[class*='mainImage'], img") as HTMLImageElement | null
            const imgSrc = img?.src ?? null

            results.push({
              listingId: productId,
              href: href.startsWith("http") ? href : `https://www.depop.com${href}`,
              text,
              imgSrc,
            })
          }

          return results
        },
        limit + 5,
      )

      const listings: Listing[] = []
      const seen = new Set<string>()

      for (const raw of rawListings) {
        if (listings.length >= limit) break
        if (seen.has(raw.listingId)) continue
        seen.add(raw.listingId)

        // Card text is like "$250.00 $169.99MArc'teryx" — price(s) + size + brand
        const price = parsePrice(raw.text)
        if (!price || price <= 0) continue

        // Extract brand — appears after the last size indicator at the end of the text
        // Text pattern: "$250.00 $169.99MArc'teryx" → brand is "Arc'teryx"
        const brandMatch = raw.text.match(/[\d.]+(?:XXS|XS|XL|XXL|S|M|L)\s*(.+)$/i)
        const brand = brandMatch ? brandMatch[1].trim() : ""

        // Build a title from the URL slug:
        // "gortexcore-arcterx-black-jacket-model-beta-27e8" → "arcterx black jacket model beta"
        const slugTitle = raw.listingId
          .replace(/-[a-f0-9]{4}$/, "")          // remove trailing hash
          .replace(/^[^-]+-/, "")                  // remove seller prefix
          .replace(/-/g, " ")
          .trim()

        const title = brand ? `${brand} ${slugTitle}` : slugTitle

        listings.push({
          marketplace: "depop",
          listingId: raw.listingId,
          title,
          price,
          currency: parseCurrency(raw.text),
          url: raw.href,
          imageUrl: raw.imgSrc,
          condition: null,
          location: null,
          postedAt: null,
          raw: { text: raw.text.substring(0, 200) },
        })
      }

      return listings
    } catch (error) {
      console.error("[depop] Playwright scraping failed:", error)
      saveDebugHtml("depop", `ERROR: ${String(error)}`)
      return []
    } finally {
      await context?.close()
    }
  },
}

// Poshmark connector: uses Playwright (Poshmark blocks/degrades plain HTTP).
// Poshmark renders listing tiles with [data-et-name="listing"] and
// links matching a[href*="/listing/"].

import { MarketplaceConnector, SearchQuery, Listing } from "./types"
import { rateLimiter, saveDebugHtml } from "./utils"
import { newSearchContext } from "./browser"

// ============================================================
// SELECTORS: update here when Poshmark changes their markup.
// Each listing is a [data-et-name="listing"] element containing:
//   - an <a> to /listing/TITLE-LISTING_ID
//   - an <img> with the listing photo
//   - text with title and price info
// There are also .card--small elements with more structured data.
// ============================================================
const SELECTORS = {
  listingCard: '[data-et-name="listing"]',
  listingLink: 'a[href*="/listing/"]',
  smallCard: ".card--small",
} as const

// ============================================================
// Helpers
// ============================================================
function buildQuery(q: SearchQuery): string {
  return [q.brand, q.title, q.keywords, q.color].filter(Boolean).join(" ")
}

function parsePrice(text: string): number | null {
  // Poshmark shows "$XX.XX": may have strikethrough original price too
  const matches = text.match(/\$[\d,.]+/g)
  if (!matches || matches.length === 0) return null
  // Take the last price (discounted/current price)
  const lastPrice = matches[matches.length - 1].replace(/[^\d.]/g, "")
  return parseFloat(lastPrice)
}

function extractListingId(href: string): string | null {
  // Poshmark URLs: /listing/TITLE-HERE-LISTING_ID
  // Listing IDs are 24-char hex strings
  const match =
    href.match(/\/listing\/[^?]*?-([a-f0-9]{24})\b/i) ??
    href.match(/\/listing\/.*?([a-f0-9]{24})/i)
  return match ? match[1] : null
}

function extractTitle(href: string): string {
  // Extract title from URL: /listing/ARCTERYX-BETA-LT-Jacket-698bded7...
  const match = href.match(/\/listing\/(.+)-[a-f0-9]{24}/i)
  if (!match) return ""
  return match[1].replace(/-/g, " ").trim()
}

// ============================================================
// Connector
// ============================================================
export const poshmarkConnector: MarketplaceConnector = {
  marketplace: "poshmark",

  buildSearchUrl(q: SearchQuery): string {
    const query = encodeURIComponent(buildQuery(q))
    let url = `https://poshmark.com/search?query=${query}&type=listings&src=dir`
    if (q.maxPrice) url += `&max_price=${q.maxPrice}`
    return url
  },

  async search(q: SearchQuery, opts?: { limit?: number }): Promise<Listing[]> {
    const limit = opts?.limit ?? 20
    await rateLimiter.wait("poshmark")

    const url = this.buildSearchUrl(q)
    let context: Awaited<ReturnType<typeof newSearchContext>> | undefined

    try {
      context = await newSearchContext()
      const page = await context.newPage()
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 })

      // Wait for listing cards to render
      try {
        await page.waitForSelector(SELECTORS.listingLink, { timeout: 10_000 })
      } catch {
        const content = await page.content()
        saveDebugHtml("poshmark", content)
        return []
      }

      await page.waitForTimeout(1500)

      // Extract listings from the .card--small elements (they have img + title + price)
      const rawListings = await page.$$eval(
        SELECTORS.smallCard,
        (cards, max) => {
          const results: Array<{
            href: string
            title: string
            imgSrc: string | null
            text: string
          }> = []
          const seen = new Set<string>()

          for (const card of cards) {
            if (results.length >= max) break

            const a = card.querySelector('a[href*="/listing/"]') as HTMLAnchorElement | null
            if (!a) continue

            const href = a.getAttribute("href") ?? ""
            if (seen.has(href)) continue
            seen.add(href)

            // Image extraction
            // Try multiple strategies since some cards lazy-load images.
            let imgSrc: string | null = null
            let title = ""

            // 1. Try the product <img> (skip tiny user-avatar imgs)
            const imgs = card.querySelectorAll("img")
            for (const img of imgs) {
              // Skip user avatar images
              if (img.classList.contains("user-image")) continue
              title = title || img.alt || ""
              if (img.src && !img.src.startsWith("data:")) {
                imgSrc = img.src
                break
              }
              // Fallback: data-src for lazy-loaded images
              const dataSrc = img.getAttribute("data-src")
              if (dataSrc) {
                imgSrc = dataSrc
                break
              }
            }

            // 2. Try <picture> > <source> srcset
            if (!imgSrc) {
              const source = card.querySelector("picture source[srcset]")
              if (source) {
                const srcset = source.getAttribute("srcset") ?? ""
                // srcset may have multiple entries; take the first URL
                const firstUrl = srcset.split(",")[0]?.trim().split(/\s+/)[0]
                if (firstUrl) imgSrc = firstUrl
              }
            }

            // 3. Try background-image on the covershot link
            if (!imgSrc) {
              const covershot = card.querySelector(".tile__covershot, [class*='covershot']") as HTMLElement | null
              if (covershot) {
                const bg = window.getComputedStyle(covershot).backgroundImage
                const bgMatch = bg?.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/)
                if (bgMatch) imgSrc = bgMatch[1]
              }
            }

            // 4. Try any img data-src we haven't checked yet
            if (!imgSrc) {
              const anyImg = card.querySelector("img[data-src]")
              if (anyImg) {
                imgSrc = anyImg.getAttribute("data-src")
              }
            }

            // The card text contains the listing title and price
            const text = card.textContent?.trim() ?? ""

            results.push({ href, title, imgSrc: imgSrc || null, text })
          }

          return results
        },
        limit + 5,
      )

      const listings: Listing[] = []
      const seen = new Set<string>()

      for (const raw of rawListings) {
        if (listings.length >= limit) break

        const listingId = extractListingId(raw.href)
        if (!listingId || seen.has(listingId)) continue
        seen.add(listingId)

        const price = parsePrice(raw.text)
        if (!price) continue

        // Title from img alt, card text, or URL slug
        const title = raw.title || extractTitle(raw.href)
        if (!title) continue

        listings.push({
          marketplace: "poshmark",
          listingId,
          title,
          price,
          currency: "USD",
          url: raw.href.startsWith("http")
            ? raw.href
            : `https://poshmark.com${raw.href}`,
          imageUrl: raw.imgSrc,
          condition: null,
          location: null,
          postedAt: null,
          raw: { text: raw.text.substring(0, 200) },
        })
      }

      return listings
    } catch (error) {
      console.error("[poshmark] Playwright scraping failed:", error)
      saveDebugHtml("poshmark", `ERROR: ${String(error)}`)
      return []
    } finally {
      await context?.close()
    }
  },
}

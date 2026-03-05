// file: lib/search.ts
import { prisma } from "./prisma"
import { ALL_CONNECTORS, CONNECTOR_MAP } from "./connectors"
import { rankListings } from "./matching"
import type { TrackedItem } from "@prisma/client"
import type { SearchQuery } from "./connectors/types"

/**
 * Run search for a single tracked item across all enabled connectors.
 * Persists new results to the DB and marks previously-unseen ones as isNew.
 * Returns insert/update/total counts for the caller.
 */
export async function searchForItem(
  item: TrackedItem,
  enabledMarketplaces?: string[],
): Promise<{ inserted: number; updated: number; total: number }> {
  const connectors = enabledMarketplaces
    ? enabledMarketplaces.map((m) => CONNECTOR_MAP[m]).filter(Boolean)
    : ALL_CONNECTORS

  const query: SearchQuery = {
    title: item.title,
    brand: item.brand ?? undefined,
    size: item.size ?? undefined,
    color: item.color ?? undefined,
    keywords: item.keywords || undefined,
    maxPrice: item.maxPrice ?? undefined,
    condition: item.condition ?? undefined,
    category: item.category,
  }

  // Search all connectors in parallel — graceful failure per marketplace
  const results = await Promise.allSettled(
    connectors.map((c) => c.search(query)),
  )

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[search] ${connectors[i].marketplace} failed:`, r.reason)
    }
  })

  const allListings = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    // Guard against invalid data from connectors (NaN prices, missing IDs)
    .filter(
      (l) =>
        l.listingId &&
        Number.isFinite(l.price) &&
        l.price > 0 &&
        l.title &&
        l.url,
    )

  const ranked = rankListings(allListings, item)

  // Get existing result IDs for this item to detect truly new listings
  const existing = await prisma.searchResult.findMany({
    where: { trackedItemId: item.id },
    select: { externalId: true, marketplace: true },
  })
  const existingSet = new Set(
    existing.map((e) => `${e.marketplace}::${e.externalId}`),
  )

  let inserted = 0
  let updated = 0

  for (const listing of ranked) {
    const key = `${listing.marketplace}::${listing.listingId}`
    const isNew = !existingSet.has(key)

    await prisma.searchResult.upsert({
      where: {
        trackedItemId_externalId_marketplace: {
          trackedItemId: item.id,
          externalId: listing.listingId,
          marketplace: listing.marketplace,
        },
      },
      update: {
        score: listing.score,
        price: listing.price,
        imageUrl: listing.imageUrl ?? undefined,
        title: listing.title,
        url: listing.url,
        condition: listing.condition,
        isNew,
      },
      create: {
        trackedItemId: item.id,
        externalId: listing.listingId,
        title: listing.title,
        price: listing.price,
        currency: listing.currency,
        condition: listing.condition,
        url: listing.url,
        imageUrl: listing.imageUrl,
        marketplace: listing.marketplace,
        location: listing.location,
        postedAt: listing.postedAt,
        score: listing.score,
        isNew,
      },
    })

    if (isNew) inserted++
    else updated++
  }

  // Update lastSearchedAt on the tracked item
  await prisma.trackedItem.update({
    where: { id: item.id },
    data: { lastSearchedAt: new Date() },
  })

  // Update newMatchCount on wishlist item if it exists
  if (inserted > 0) {
    await prisma.wishlistItem.updateMany({
      where: { trackedItemId: item.id },
      data: { newMatchCount: { increment: inserted } },
    })
  }

  return { inserted, updated, total: ranked.length }
}

/**
 * Cron-ready function: refresh all tracked items for all users.
 * Call this from a scheduled job (e.g., Vercel Cron, GitHub Actions).
 */
export async function refreshAllTrackedItems(): Promise<void> {
  const items = await prisma.trackedItem.findMany()
  console.log(`[cron] Refreshing ${items.length} tracked items...`)
  await Promise.allSettled(items.map((item) => searchForItem(item)))
  console.log("[cron] Done.")
}

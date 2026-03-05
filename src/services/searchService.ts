// file: src/services/searchService.ts
// Service layer for running marketplace searches against tracked items.

import { prisma } from "@/lib/prisma"
import { searchForItem } from "@/lib/search"

/**
 * Run search for a single tracked item across all marketplace connectors.
 * Loads the item from DB, calls connectors in parallel (with per-marketplace
 * rate limiting), upserts results, and returns insert/update/total counts.
 */
export async function runSearchForTrackedItem(
  trackedItemId: string,
): Promise<{ inserted: number; updated: number; total: number }> {
  const item = await prisma.trackedItem.findUnique({
    where: { id: trackedItemId },
  })
  if (!item) {
    throw new Error(`Tracked item not found: ${trackedItemId}`)
  }

  return searchForItem(item)
}

/**
 * Run search for all tracked items, optionally filtered by userId.
 * Used by POST /api/search/run when no trackedItemId is provided.
 * Each item is searched in parallel; individual failures are captured
 * without stopping the batch.
 */
export async function runSearchForAllTrackedItems(
  userId?: string,
): Promise<{
  itemCount: number
  results: Array<{
    trackedItemId: string
    title: string
    inserted: number
    updated: number
    total: number
    error?: string
  }>
}> {
  const items = await prisma.trackedItem.findMany({
    where: userId ? { userId } : {},
  })

  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const counts = await searchForItem(item)
      return {
        trackedItemId: item.id,
        title: item.title,
        ...counts,
      }
    }),
  )

  return {
    itemCount: items.length,
    results: settled.map((r, i) => {
      if (r.status === "fulfilled") return r.value
      return {
        trackedItemId: items[i].id,
        title: items[i].title,
        inserted: 0,
        updated: 0,
        total: 0,
        error: String(r.reason),
      }
    }),
  }
}

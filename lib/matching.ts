// Keyword-based matching and scoring for listings vs tracked items.

import type { TrackedItem } from "@prisma/client"
import type { Listing } from "./connectors/types"

const CONDITIONS_ORDER = ["new", "like_new", "good", "fair"]

/**
 * Score a listing against a tracked item.
 * Returns a value between 0 and 1 (higher = better match).
 */
export function scoreListing(listing: Listing, item: TrackedItem): number {
  const titleLower = listing.title.toLowerCase()
  let score = 0
  let maxScore = 0

  // Brand match (weight: 30)
  if (item.brand) {
    maxScore += 30
    if (titleLower.includes(item.brand.toLowerCase())) score += 30
  }

  // Title keywords match (weight: 30)
  {
    maxScore += 30
    const words = item.title.toLowerCase().split(/\s+/).filter(Boolean)
    const matched = words.filter((w) => titleLower.includes(w)).length
    score += 30 * (matched / Math.max(words.length, 1))
  }

  // Keywords match (weight: 20)
  if (item.keywords) {
    maxScore += 20
    const kws = item.keywords.toLowerCase().split(/\s+/).filter(Boolean)
    const matched = kws.filter((k) => titleLower.includes(k)).length
    score += 20 * (matched / Math.max(kws.length, 1))
  }

  // Size match (weight: 10)
  if (item.size) {
    maxScore += 10
    if (titleLower.includes(item.size.toLowerCase())) score += 10
  }

  // Color match (weight: 10)
  if (item.color) {
    maxScore += 10
    if (titleLower.includes(item.color.toLowerCase())) score += 10
  }

  // Normalize
  const normalized = maxScore > 0 ? score / maxScore : 0

  // Price penalty: if listing exceeds maxPrice, reduce score significantly
  if (item.maxPrice && listing.price > item.maxPrice) {
    return normalized * 0.3
  }

  // Condition check: if listing condition is worse than desired, slight penalty
  if (item.condition && listing.condition) {
    const desiredIdx = CONDITIONS_ORDER.indexOf(item.condition)
    const listingIdx = CONDITIONS_ORDER.indexOf(listing.condition)
    if (listingIdx > desiredIdx) {
      return normalized * 0.7
    }
  }

  return normalized
}

/** Filter and sort listings, returning only those above a minimum score. */
export function rankListings(
  listings: Listing[],
  item: TrackedItem,
  minScore = 0.2,
): (Listing & { score: number })[] {
  return listings
    .map((l) => ({ ...l, score: scoreListing(l, item) }))
    .filter((l) => l.score >= minScore)
    .sort((a, b) => {
      // Sort by relevance (score) descending, then by price ascending for ties
      if (b.score !== a.score) return b.score - a.score
      return a.price - b.price
    })
}

// Content-based filtering recommendation engine.
// Uses tracked item attributes, user interaction signals (saves, clicks, views),
// and search result metadata to surface personalized listing recommendations.

import { prisma } from "./prisma"

interface UserProfile {
  brands: Map<string, number>
  categories: Map<string, number>
  priceRange: { min: number; max: number; avg: number }
  conditions: Map<string, number>
  keywords: Map<string, number>
  colors: Map<string, number>
  sizes: Map<string, number>
}

interface RecommendedListing {
  id: string
  title: string
  price: number
  currency: string
  condition: string | null
  url: string
  imageUrl: string | null
  marketplace: string
  score: number
  reason: string
}

/**
 * Build a user preference profile from their tracked items, saved listings, and event history.
 */
async function buildUserProfile(userId: string): Promise<UserProfile> {
  // Fetch user's tracked items (explicit preferences)
  const trackedItems = await prisma.trackedItem.findMany({
    where: { userId },
    select: {
      brand: true,
      category: true,
      maxPrice: true,
      condition: true,
      keywords: true,
      color: true,
      size: true,
      title: true,
    },
  })

  // Fetch saved listings (implicit positive signals)
  const savedListings = await prisma.savedListing.findMany({
    where: { userId },
    include: {
      searchResult: {
        select: { title: true, price: true, marketplace: true, condition: true },
      },
    },
  })

  // Fetch user events for additional signals
  const events = await prisma.event.findMany({
    where: {
      userId,
      type: { in: ["click_outbound", "favorite_listing", "view_listing"] },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  // Build weighted profile
  const brands = new Map<string, number>()
  const categories = new Map<string, number>()
  const conditions = new Map<string, number>()
  const keywords = new Map<string, number>()
  const colors = new Map<string, number>()
  const sizes = new Map<string, number>()
  const prices: number[] = []

  // Tracked items carry the most weight (explicit preferences)
  for (const item of trackedItems) {
    if (item.brand) increment(brands, item.brand.toLowerCase(), 3)
    if (item.category) increment(categories, item.category.toLowerCase(), 3)
    if (item.condition) increment(conditions, item.condition.toLowerCase(), 2)
    if (item.color) increment(colors, item.color.toLowerCase(), 2)
    if (item.size) increment(sizes, item.size.toLowerCase(), 2)
    if (item.maxPrice) prices.push(item.maxPrice)

    // Parse keywords from title and keywords field
    const allWords = [item.title, item.keywords].filter(Boolean).join(" ")
    for (const w of tokenize(allWords)) {
      increment(keywords, w, 2)
    }
  }

  // Saved listings carry moderate weight (implicit positive signal)
  for (const saved of savedListings) {
    const r = saved.searchResult
    if (r.condition) increment(conditions, r.condition.toLowerCase(), 1)
    prices.push(r.price)
    for (const w of tokenize(r.title)) {
      increment(keywords, w, 1)
    }
  }

  // Compute price range
  const priceRange = prices.length > 0
    ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      }
    : { min: 0, max: 500, avg: 200 }

  return { brands, categories, priceRange, conditions, keywords, colors, sizes }
}

/**
 * Score a search result against the user's preference profile.
 * Returns a 0-1 score indicating relevance.
 */
function scoreForProfile(
  result: {
    title: string
    price: number
    condition: string | null
    marketplace: string
  },
  profile: UserProfile,
): { score: number; reason: string } {
  const titleLower = result.title.toLowerCase()
  const titleWords = tokenize(result.title)
  let score = 0
  let maxScore = 0
  const reasons: string[] = []

  // Brand match (weight: 25)
  maxScore += 25
  for (const [brand, weight] of profile.brands) {
    if (titleLower.includes(brand)) {
      score += 25 * Math.min(weight / 3, 1)
      reasons.push(`Matches your interest in ${brand}`)
      break
    }
  }

  // Keyword overlap (weight: 30)
  maxScore += 30
  let kwMatched = 0
  let kwTotal = 0
  for (const [kw, weight] of profile.keywords) {
    if (weight >= 2) {
      kwTotal++
      if (titleWords.includes(kw) || titleLower.includes(kw)) {
        kwMatched += Math.min(weight / 2, 1)
      }
    }
  }
  if (kwTotal > 0) {
    const kwScore = 30 * (kwMatched / kwTotal)
    score += kwScore
    if (kwMatched > 0) reasons.push("Matches your search keywords")
  }

  // Price fit (weight: 20)
  maxScore += 20
  if (profile.priceRange.avg > 0) {
    const priceDiff = Math.abs(result.price - profile.priceRange.avg) / profile.priceRange.avg
    const priceScore = 20 * Math.max(0, 1 - priceDiff)
    score += priceScore
    if (priceScore > 10) reasons.push("In your price range")
  }

  // Condition preference (weight: 10)
  if (result.condition && profile.conditions.size > 0) {
    maxScore += 10
    const condWeight = profile.conditions.get(result.condition.toLowerCase()) ?? 0
    score += 10 * Math.min(condWeight / 2, 1)
  }

  // Color match from title (weight: 15)
  maxScore += 15
  for (const [color] of profile.colors) {
    if (titleLower.includes(color)) {
      score += 15
      reasons.push(`Matches your color preference`)
      break
    }
  }

  const normalized = maxScore > 0 ? score / maxScore : 0

  // Price penalty: if way over average, reduce score
  if (profile.priceRange.max > 0 && result.price > profile.priceRange.max * 1.5) {
    return { score: normalized * 0.3, reason: reasons[0] ?? "Related to your interests" }
  }

  return {
    score: normalized,
    reason: reasons[0] ?? "Related to your tracked items",
  }
}

/**
 * Get personalized recommendations for a user.
 * Uses content-based filtering on existing search results across all tracked items.
 */
export async function getRecommendations(
  userId: string,
  limit = 20,
): Promise<RecommendedListing[]> {
  const profile = await buildUserProfile(userId)

  // Get all search results for this user's tracked items that they haven't already saved
  const savedIds = new Set(
    (await prisma.savedListing.findMany({
      where: { userId },
      select: { searchResultId: true },
    })).map((s) => s.searchResultId),
  )

  const allResults = await prisma.searchResult.findMany({
    where: {
      trackedItem: { userId },
    },
    orderBy: { foundAt: "desc" },
    take: 200,
  })

  // Score and rank results
  const scored: RecommendedListing[] = []
  const seen = new Set<string>()

  for (const r of allResults) {
    // Deduplicate by title similarity
    const titleKey = r.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 40)
    if (seen.has(titleKey)) continue
    seen.add(titleKey)

    // Skip already-saved listings (recommend new things)
    if (savedIds.has(r.id)) continue

    const { score, reason } = scoreForProfile(
      {
        title: r.title,
        price: r.price,
        condition: r.condition,
        marketplace: r.marketplace,
      },
      profile,
    )

    if (score >= 0.3) {
      scored.push({
        id: r.id,
        title: r.title,
        price: r.price,
        currency: r.currency,
        condition: r.condition,
        url: r.url,
        imageUrl: r.imageUrl,
        marketplace: r.marketplace,
        score,
        reason,
      })
    }
  }

  // Sort by score descending, then price ascending
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.price - b.price
  })

  return scored.slice(0, limit)
}

// ── Helpers ──

function increment(map: Map<string, number>, key: string, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount)
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "this", "that", "was", "are",
  "be", "has", "had", "do", "does", "not", "no", "so", "if", "my", "up",
  "new", "used", "size", "color", "brand",
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_/,.()+]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

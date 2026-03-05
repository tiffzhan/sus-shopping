export type SearchQuery = {
  title: string
  brand?: string | null
  size?: string | null
  color?: string | null
  keywords?: string | null
  maxPrice?: number | null
  condition?: string | null
  category?: string | null
}

export type Listing = {
  marketplace: "ebay" | "poshmark" | "depop"
  listingId: string
  title: string
  price: number
  currency: string
  url: string
  imageUrl?: string | null
  condition?: string | null
  location?: string | null
  postedAt?: Date | null
  raw?: any // store raw parsed fields for debugging
}

export interface MarketplaceConnector {
  marketplace: Listing["marketplace"]
  buildSearchUrl(q: SearchQuery): string
  search(q: SearchQuery, opts?: { limit?: number }): Promise<Listing[]>
}

// Backward compatibility alias
export type QueryParams = SearchQuery

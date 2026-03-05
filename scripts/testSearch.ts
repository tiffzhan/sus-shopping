#!/usr/bin/env tsx
// file: scripts/testSearch.ts
// Run: npx tsx scripts/testSearch.ts
// Or:  npm run test:search
//
// Runs a sample SearchQuery against all three marketplace connectors
// and prints the top 5 results per marketplace.

import { ebayConnector } from "../lib/connectors/ebay"
import { poshmarkConnector } from "../lib/connectors/poshmark"
import { depopConnector } from "../lib/connectors/depop"
import type { SearchQuery, MarketplaceConnector } from "../lib/connectors/types"

const SAMPLE_QUERY: SearchQuery = {
  title: "Arc'teryx Beta LT Jacket",
  brand: "Arc'teryx",
  size: "M",
  color: "Black",
  maxPrice: 350,
  condition: "like_new",
  category: "outerwear",
}

const connectors: MarketplaceConnector[] = [
  ebayConnector,
  poshmarkConnector,
  depopConnector,
]

async function main() {
  console.log("=".repeat(60))
  console.log("SUS SHOPPING — Search Test")
  console.log("=".repeat(60))
  console.log("Query:", JSON.stringify(SAMPLE_QUERY, null, 2))
  console.log("=".repeat(60))

  for (const connector of connectors) {
    const mp = connector.marketplace.toUpperCase()
    console.log(`\n--- ${mp} ---`)
    console.log(`URL: ${connector.buildSearchUrl(SAMPLE_QUERY)}`)

    try {
      const start = Date.now()
      const results = await connector.search(SAMPLE_QUERY, { limit: 5 })
      const elapsed = Date.now() - start

      console.log(`Found ${results.length} results (${elapsed}ms)`)

      if (results.length === 0) {
        console.log("  (no results)")
        continue
      }

      results.slice(0, 5).forEach((r, i) => {
        console.log(`\n  [${i + 1}] ${r.title}`)
        console.log(`      Price:     ${r.currency} ${r.price}`)
        console.log(`      URL:       ${r.url}`)
        if (r.condition) console.log(`      Condition: ${r.condition}`)
        if (r.location) console.log(`      Location:  ${r.location}`)
        if (r.imageUrl) console.log(`      Image:     ${r.imageUrl.substring(0, 80)}...`)
      })
    } catch (error) {
      console.error(`  ERROR: ${error}`)
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("Done.")
}

main().catch(console.error)

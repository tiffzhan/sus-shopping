// file: lib/connectors/index.ts
export { ebayConnector } from "./ebay"
export { poshmarkConnector } from "./poshmark"
export { depopConnector } from "./depop"
export type { SearchQuery, Listing, MarketplaceConnector, QueryParams } from "./types"

import { ebayConnector } from "./ebay"
import { poshmarkConnector } from "./poshmark"
import { depopConnector } from "./depop"
import type { MarketplaceConnector } from "./types"

export const ALL_CONNECTORS: MarketplaceConnector[] = [
  ebayConnector,
  poshmarkConnector,
  depopConnector,
]

export const CONNECTOR_MAP: Record<string, MarketplaceConnector> = {
  ebay: ebayConnector,
  poshmark: poshmarkConnector,
  depop: depopConnector,
}

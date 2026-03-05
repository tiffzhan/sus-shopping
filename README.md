# SUS SHOPPING ♻️💖

> Your personal assistant for sustainable second-hand fashion ♻️💖

---

## Architecture Overview

### Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js (credentials provider) |
| Styling | Tailwind CSS + CSS custom properties |
| Marketplace APIs | eBay Browse API (official) + URL stubs for Poshmark/Depop |

### Project Structure
```
sus-shopping/
├── app/
│   ├── (auth)/              # Login, Signup (no nav shell)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/         # Protected pages with sidebar nav
│   │   ├── layout.tsx       # Auth guard + Nav
│   │   ├── dashboard/       # Item list + stats
│   │   ├── tracked/
│   │   │   ├── new/         # Create tracked item form
│   │   │   └── [id]/        # Item detail + search results + filters
│   │   ├── wishlist/        # Wishlisted items
│   │   ├── saved/           # Favorited listings
│   │   ├── recommendations/ # Placeholder (scaffold)
│   │   └── settings/        # Config, API keys, cron docs
│   └── api/
│       ├── auth/            # NextAuth + signup
│       ├── tracked-items/   # CRUD + search trigger
│       ├── wishlist/        # Add/remove wishlist items
│       ├── saved/           # Save/unsave listings
│       ├── events/          # User event logging
│       └── refresh/         # Cron endpoint
├── components/
│   ├── Nav.tsx              # Sidebar navigation
│   ├── TrackedItemCard.tsx  # Dashboard item row
│   └── ListingCard.tsx      # Search result card
├── lib/
│   ├── auth.ts              # NextAuth options
│   ├── prisma.ts            # Prisma singleton
│   ├── matching.ts          # Scoring algorithm
│   ├── search.ts            # Search orchestration
│   └── connectors/
│       ├── types.ts         # Connector interface
│       ├── ebay.ts          # eBay Browse API (official)
│       ├── poshmark.ts      # URL stub (no public API)
│       └── depop.ts         # URL stub (no public API)
└── prisma/
    ├── schema.prisma        # Data model
    └── seed.ts              # Demo data
```

### Connector Architecture
Each marketplace is a separate module implementing:
```typescript
interface Connector {
  name: string;
  search(params: QueryParams): Promise<Listing[]>;
  buildSearchUrl(params: QueryParams): string;  // for manual browsing
}
```

- **eBay**: Uses the official eBay Browse API (OAuth2 app token). Set `EBAY_CLIENT_ID` + `EBAY_CLIENT_SECRET` to enable.
- **Poshmark / Depop**: No public API available. These return `[]` from `search()` and provide a search URL via `buildSearchUrl()` that opens in a new tab.
- **Adding a new connector**: Create `lib/connectors/yourmarket.ts`, implement the interface, and add to `lib/connectors/index.ts`.

### Matching / Scoring
`lib/matching.ts` scores each listing against a tracked item (0–1 scale):
- Brand match: 30 pts
- Title keyword overlap: 30 pts
- Free-text keyword match: 20 pts
- Size match: 10 pts
- Color match: 10 pts

Results exceeding `maxPrice` are penalized to 30% of score. Worse-condition results penalized to 70%.

### Event System (Recommender Scaffold)
Every user action posts to `POST /api/events`:
- `view_listing` — user opens a listing
- `favorite_listing` — user saves a listing
- `add_to_wishlist` — user wishlists an item
- `dismiss_listing` — user dismisses a result (TODO: UI button)
- `click_outbound` — user clicks through to marketplace
- `search` — user triggers a search

Events are stored in the `Event` table with JSON payloads, ready for model training.

---

## Build & Run Guide

### Prerequisites
- Node.js 18+
- npm

### 1. Clone / Download
```bash
cd sus-shopping
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment
```bash
cp .env.local.example .env.local
# Edit .env.local and set NEXTAUTH_SECRET to a random string:
# openssl rand -base64 32
```

### 4. Initialize database
```bash
npm run db:generate   # generates Prisma client
npm run db:push       # creates SQLite DB and tables
npm run db:seed       # seeds with demo user + data
```

Or run all at once:
```bash
npm run setup
```

### 5. Start dev server
```bash
npm run dev
# → http://localhost:3000
```

### 6. Log in
```
Email: demo@sus.shopping
Password: demo1234
```

---

## Enabling Live eBay Search

1. Create a developer account at https://developer.ebay.com
2. Create a new app → get **Client ID** and **Client Secret**
3. Add to `.env.local`:
   ```
   EBAY_CLIENT_ID=your_client_id
   EBAY_CLIENT_SECRET=your_client_secret
   ```
4. Restart dev server
5. Open any tracked item → click **SEARCH NOW**

Without credentials, the app uses seeded mock data and provides manual search URLs.

---

## Enabling Notifications (Email Stub)

The notification system is stubbed. To wire it up:

1. Add SMTP config to `.env.local`:
   ```
   SMTP_HOST=smtp.yourprovider.com
   SMTP_PORT=587
   SMTP_USER=you@example.com
   SMTP_PASS=yourpassword
   SMTP_FROM=noreply@sus.shopping
   ```
2. Create `lib/notifications.ts` implementing `sendNotificationEmail(userId, trackedItem, newListings)`
3. Call it from `lib/search.ts` after finding new matches for items with `notifyMe: true`

---

## Background Refresh (Cron)

The endpoint `POST /api/refresh` runs `refreshAllTrackedItems()`.

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [{ "path": "/api/refresh", "schedule": "0 */6 * * *" }]
}
```

**GitHub Actions** (every 6 hours):
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST $NEXTJS_URL/api/refresh \
            -H "x-cron-secret: $CRON_SECRET"
```

---

## Future: Adding Recommender

1. Collect enough event data (already logging)
2. Train a collaborative filtering or content-based model on the `Event` table
3. Add `GET /api/recommendations` returning personalized `SearchResult[]`
4. Replace the placeholder in `app/(dashboard)/recommendations/page.tsx`

---

## Demo Credentials
```
Email:    demo@sus.shopping
Password: demo1234
```

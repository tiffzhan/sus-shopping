// file: app/(dashboard)/tracked/[id]/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";

interface SearchResult {
  id: string;
  externalId: string;
  title: string;
  price: number;
  currency: string;
  condition?: string;
  url: string;
  imageUrl?: string;
  marketplace: string;
  location?: string;
  score: number;
  isNew: boolean;
  foundAt: string;
}

interface TrackedItem {
  id: string;
  title: string;
  brand?: string;
  size?: string;
  color?: string;
  keywords: string;
  maxPrice?: number;
  condition?: string;
  category: string;
  notes?: string;
  notifyMe: boolean;
  lastSearchedAt?: string;
  searchResults: SearchResult[];
  wishlistItems: { newMatchCount: number }[];
}

const MARKETPLACES = ["ebay", "poshmark", "depop"];
const CONDITION_ORDER = ["new", "like_new", "good", "fair"];

export default function TrackedItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<TrackedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchUrls, setSearchUrls] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [inWishlist, setInWishlist] = useState(false);

  // Filters
  const [enabledMarketplaces, setEnabledMarketplaces] = useState<Set<string>>(
    new Set(MARKETPLACES)
  );
  const [filterCondition, setFilterCondition] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [filterSize, setFilterSize] = useState<string>("");

  const fetchItem = useCallback(async () => {
    const res = await fetch(`/api/tracked-items/${id}`);
    if (!res.ok) { router.push("/dashboard"); return; }
    const data = await res.json();
    setItem(data);
    setInWishlist(data.wishlistItems.length > 0);
  }, [id, router]);

  const fetchSearchUrls = useCallback(async () => {
    const res = await fetch(`/api/tracked-items/${id}/search`);
    if (res.ok) setSearchUrls(await res.json().then((d) => d.urls ?? {}));
  }, [id]);

  const fetchSaved = useCallback(async () => {
    const res = await fetch("/api/saved");
    if (res.ok) {
      const data = await res.json();
      setSavedIds(new Set(data.map((s: { searchResultId: string }) => s.searchResultId)));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchItem(), fetchSearchUrls(), fetchSaved()]).finally(() => setLoading(false));
  }, [fetchItem, fetchSearchUrls, fetchSaved]);

  async function runSearch() {
    setSearching(true);
    const res = await fetch(`/api/tracked-items/${id}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketplaces: [...enabledMarketplaces] }),
    });
    if (res.ok) {
      await fetchItem();
    }
    setSearching(false);
  }

  async function toggleWishlist() {
    if (inWishlist) {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackedItemId: id }),
      });
      setInWishlist(false);
    } else {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackedItemId: id }),
      });
      setInWishlist(true);
    }
  }

  async function toggleSave(searchResultId: string) {
    if (savedIds.has(searchResultId)) {
      await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchResultId }),
      });
      setSavedIds((s) => { const n = new Set(s); n.delete(searchResultId); return n; });
    } else {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchResultId }),
      });
      setSavedIds((s) => new Set(s).add(searchResultId));
    }
  }

  async function deleteItem() {
    if (!confirm("Delete this tracked item?")) return;
    await fetch(`/api/tracked-items/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  function toggleMarketplace(mp: string) {
    setEnabledMarketplaces((prev) => {
      const next = new Set(prev);
      if (next.has(mp)) next.delete(mp); else next.add(mp);
      return next;
    });
  }

  // Apply filters to results
  const filteredResults = (item?.searchResults ?? []).filter((r) => {
    if (!enabledMarketplaces.has(r.marketplace)) return false;
    if (filterCondition && r.condition !== filterCondition) return false;
    if (filterMaxPrice && r.price > parseFloat(filterMaxPrice)) return false;
    if (filterSize && !r.title.toLowerCase().includes(filterSize.toLowerCase())) return false;
    return true;
  });

  if (loading) return <LoadingState />;
  if (!item) return null;

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div className="sigil" style={{ marginBottom: "8px" }}>
          <Link href="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            ← DASHBOARD
          </Link>
          {" "}/ TRACKED ITEM
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "22px", margin: "0 0 8px" }}>{item.title}</h1>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {item.brand && <Tag value={item.brand} />}
              {item.size && <Tag value={`SZ ${item.size}`} />}
              {item.color && <Tag value={item.color} />}
              {item.maxPrice && <Tag value={`≤ $${item.maxPrice}`} />}
              {item.condition && <Tag value={item.condition.replace("_", " ").toUpperCase()} />}
              <Tag value={item.category.toUpperCase()} dim />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-ghost"
              onClick={toggleWishlist}
              style={{ color: inWishlist ? "var(--text)" : "var(--text-dim)", borderColor: inWishlist ? "var(--border-bright)" : "var(--border)" }}
            >
              {inWishlist ? "◈ WISHLISTED" : "◇ WISHLIST"}
            </button>
            <button className="btn-danger" onClick={deleteItem}>✕ DELETE</button>
          </div>
        </div>
        {item.notes && (
          <p style={{ marginTop: "12px", color: "var(--text-dim)", fontSize: "12px", fontStyle: "italic" }}>
            {item.notes}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px", alignItems: "start" }}>
        {/* Filter sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Search button */}
          <div>
            <button
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={runSearch}
              disabled={searching || enabledMarketplaces.size === 0}
            >
              {searching ? (
                <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                  <span className="pulse-dot" /> SEARCHING...
                </span>
              ) : "↻ SEARCH NOW"}
            </button>
            {item.lastSearchedAt && (
              <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "6px", textAlign: "center" }}>
                LAST: {new Date(item.lastSearchedAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Marketplace toggles */}
          <FilterSection label="MARKETPLACES">
            {MARKETPLACES.map((mp) => (
              <label key={mp} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={enabledMarketplaces.has(mp)}
                  onChange={() => toggleMarketplace(mp)}
                  style={{ width: "auto", accentColor: "white" }}
                />
                <span style={{ fontSize: "10px", fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em", color: "var(--text-dim)", textTransform: "uppercase" }}>
                  {mp}
                </span>
                {searchUrls[mp] && (
                  <a
                    href={searchUrls[mp]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--text-muted)", fontSize: "10px", marginLeft: "auto" }}
                    title={`Open ${mp} search`}
                  >
                    ↗
                  </a>
                )}
              </label>
            ))}
            <div style={{ fontSize: "9px", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px" }}>
              GRAILED, VESTIAIRE → COMING SOON
            </div>
          </FilterSection>

          {/* Price filter */}
          <FilterSection label="MAX PRICE">
            <input
              type="number"
              value={filterMaxPrice}
              onChange={(e) => setFilterMaxPrice(e.target.value)}
              placeholder={item.maxPrice ? `${item.maxPrice}` : "No limit"}
              min="0"
            />
          </FilterSection>

          {/* Condition filter */}
          <FilterSection label="CONDITION">
            {[{ value: "", label: "ANY" }, { value: "new", label: "NEW" }, { value: "like_new", label: "LIKE NEW" }, { value: "good", label: "GOOD" }, { value: "fair", label: "FAIR" }].map((c) => (
              <label key={c.value} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="condition"
                  checked={filterCondition === c.value}
                  onChange={() => setFilterCondition(c.value)}
                  style={{ width: "auto", accentColor: "white" }}
                />
                <span style={{ fontSize: "10px", fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em", color: filterCondition === c.value ? "var(--text)" : "var(--text-dim)" }}>
                  {c.label}
                </span>
              </label>
            ))}
          </FilterSection>

          {/* Size filter */}
          <FilterSection label="SIZE (FILTER)">
            <input
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              placeholder={item.size ?? "Any size"}
            />
          </FilterSection>

          {/* Manual search links */}
          <FilterSection label="OPEN IN BROWSER">
            {Object.entries(searchUrls).map(([mp, url]) => (
              <a
                key={mp}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontSize: "10px",
                  fontFamily: "'Orbitron', monospace",
                  letterSpacing: "0.1em",
                  color: "var(--text-dim)",
                  textDecoration: "none",
                  padding: "4px 0",
                  borderBottom: "1px solid transparent",
                  transition: "all 0.15s",
                }}
                className="manual-link"
              >
                {mp.toUpperCase()} ↗
              </a>
            ))}
          </FilterSection>
        </div>

        {/* Results */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
              {filteredResults.length} RESULT{filteredResults.length !== 1 ? "S" : ""}
              {filteredResults.filter((r) => r.isNew).length > 0 && (
                <span className="badge badge-new" style={{ marginLeft: "10px" }}>
                  {filteredResults.filter((r) => r.isNew).length} NEW
                </span>
              )}
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div style={{ border: "1px dashed var(--border)", padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", opacity: 0.2, marginBottom: "12px" }}>◎</div>
              <p style={{ color: "var(--text-dim)", fontSize: "12px" }}>
                {item.searchResults.length === 0 ? "PRESS SEARCH NOW TO FIND LISTINGS" : "NO RESULTS MATCH YOUR FILTERS"}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
              {filteredResults.map((result) => (
                <ListingCard
                  key={result.id}
                  result={result}
                  isSaved={savedIds.has(result.id)}
                  onToggleSave={() => toggleSave(result.id)}
                  trackedItemId={id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .manual-link:hover { color: var(--text) !important; border-bottom-color: var(--border) !important; }
      `}</style>
    </div>
  );
}

function Tag({ value, dim }: { value: string; dim?: boolean }) {
  return (
    <span style={{ fontSize: "9px", fontFamily: "'Orbitron', monospace", letterSpacing: "0.08em", color: dim ? "var(--text-muted)" : "var(--text-dim)", border: `1px solid ${dim ? "var(--border)" : "var(--border-bright)"}`, padding: "1px 6px" }}>
      {value}
    </span>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "10px" }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: "32px 40px", display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)" }}>
      <span className="pulse-dot" />
      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "11px", letterSpacing: "0.1em" }}>
        LOADING...
      </span>
    </div>
  );
}

"use client";

interface SearchResult {
  id: string;
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

interface Props {
  result: SearchResult;
  isSaved: boolean;
  onToggleSave: () => void;
  trackedItemId: string;
}

const MARKETPLACE_LABELS: Record<string, string> = {
  ebay: "EBAY",
  poshmark: "POSHMARK",
  depop: "DEPOP",
  mock: "DEMO",
};

export default function ListingCard({ result, isSaved, onToggleSave }: Props) {
  async function handleOutboundClick() {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "click_outbound", payload: { searchResultId: result.id, marketplace: result.marketplace } }),
    });
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "4/3", background: "var(--surface2)", overflow: "hidden" }}>
        {result.imageUrl ? (
          <img
            src={result.imageUrl}
            alt={result.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px 12px 0 0" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "'Poppins', sans-serif", fontSize: "10px" }}>
            NO IMAGE
          </div>
        )}
        {/* Overlays */}
        <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "4px" }}>
          {result.isNew && <span className="badge badge-new">NEW</span>}
          <span className="badge badge-marketplace">{MARKETPLACE_LABELS[result.marketplace] ?? result.marketplace.toUpperCase()}</span>
        </div>
        <button
          onClick={onToggleSave}
          style={{
            position: "absolute", top: "8px", right: "8px",
            background: isSaved ? "var(--accent)" : "rgba(255,255,255,0.85)",
            color: isSaved ? "#fff" : "var(--text-dim)",
            border: `1px solid ${isSaved ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "50%",
            width: "28px", height: "28px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "12px",
            fontFamily: "sans-serif",
            transition: "all 0.15s",
          }}
          title={isSaved ? "Unsave" : "Save"}
        >
          {isSaved ? "★" : "☆"}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.4, color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {result.title}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: "15px", fontWeight: 700 }}>
            ${result.price.toFixed(2)}
          </span>
          {result.condition && (
            <span style={{ fontSize: "9px", fontFamily: "'Poppins', sans-serif", letterSpacing: "0.08em", color: "var(--text-dim)", border: "1px solid var(--border)", padding: "1px 5px" }}>
              {result.condition.replace("_", " ").toUpperCase()}
            </span>
          )}
        </div>

        {/* Score bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "'Poppins', sans-serif", letterSpacing: "0.1em" }}>MATCH</span>
            <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "'Poppins', sans-serif" }}>
              {Math.round(result.score * 100)}%
            </span>
          </div>
          <div className="score-bar">
            <div className="score-bar-fill" style={{ width: `${result.score * 100}%` }} />
          </div>
        </div>

        {result.location && (
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>📍 {result.location}</div>
        )}

        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOutboundClick}
          style={{
            display: "block",
            marginTop: "auto",
            textAlign: "center",
            fontFamily: "'Poppins', sans-serif",
            fontSize: "9px",
            letterSpacing: "0.1em",
            color: "var(--text-dim)",
            border: "1px solid var(--border)",
            padding: "6px",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
          className="view-link"
        >
          VIEW ON {MARKETPLACE_LABELS[result.marketplace] ?? result.marketplace.toUpperCase()} ↗
        </a>
      </div>

      <style jsx>{`
        .view-link:hover {
          border-color: var(--accent) !important;
          color: var(--text) !important;
        }
      `}</style>
    </div>
  );
}

// Content-based recommendation page.
// Fetches personalized recommendations from the API and displays them as listing cards.

"use client";
import { useEffect, useState } from "react";

interface Recommendation {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string | null;
  url: string;
  imageUrl: string | null;
  marketplace: string;
  score: number;
  reason: string;
}

const MARKETPLACE_LABELS: Record<string, string> = {
  ebay: "EBAY",
  poshmark: "POSHMARK",
  depop: "DEPOP",
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/recommendations");
        if (res.ok) {
          setRecs(await res.json());
        } else {
          setError("Failed to load recommendations");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: "32px 40px", maxWidth: "960px" }}>
      <div style={{ marginBottom: "32px" }}>
        <div className="sigil" style={{ marginBottom: "8px" }}>For You</div>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Recommendations</h1>
        <p style={{ color: "var(--text-dim)", fontSize: "13px", marginTop: "8px", fontWeight: 300 }}>
          Personalized picks based on your tracked items and saved listings
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)", padding: "40px 0" }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: "13px" }}>Finding recommendations for you...</span>
        </div>
      ) : error ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--text-dim)" }}>{error}</p>
        </div>
      ) : recs.length === 0 ? (
        <div style={{ border: "1px dashed var(--border)", borderRadius: "12px", padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}>✦</div>
          <h3 style={{ fontSize: "16px", color: "var(--text-dim)", marginBottom: "12px", fontWeight: 500 }}>
            No Recommendations Yet
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", maxWidth: "400px", margin: "0 auto", lineHeight: 1.6 }}>
            Track items and run searches to build your preference profile. Recommendations will appear here once we learn your style.
          </p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px" }}>
            {recs.length} recommendation{recs.length !== 1 ? "s" : ""} found
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {recs.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        </>
      )}

      {/* How it works */}
      <div style={{ marginTop: "40px", padding: "24px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--surface)" }}>
        <h3 style={{ fontSize: "14px", marginBottom: "16px", fontWeight: 600 }}>How Recommendations Work</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          {[
            { icon: "🔍", title: "Track Items", desc: "Your tracked items tell us what brands, sizes, and styles you love" },
            { icon: "⭐", title: "Save Listings", desc: "Saved listings help us understand your price range and condition preferences" },
            { icon: "✦", title: "Get Picks", desc: "Our content filter matches new listings to your preference profile" },
          ].map((step) => (
            <div key={step.title} style={{ textAlign: "center", padding: "12px" }}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>{step.icon}</div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{step.title}</div>
              <div style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: 1.5 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecCard({ rec }: { rec: Recommendation }) {
  async function handleClick() {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "click_outbound", payload: { searchResultId: rec.id, source: "recommendations" } }),
    });
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "4/3", background: "var(--surface2)", overflow: "hidden", borderRadius: "12px 12px 0 0" }}>
        {rec.imageUrl ? (
          <img
            src={rec.imageUrl}
            alt={rec.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "11px" }}>
            No Image
          </div>
        )}
        <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "4px" }}>
          <span className="badge badge-marketplace">
            {MARKETPLACE_LABELS[rec.marketplace] ?? rec.marketplace.toUpperCase()}
          </span>
        </div>
        {/* Match score badge */}
        <div style={{
          position: "absolute", top: "8px", right: "8px",
          background: "rgba(255,255,255,0.9)", borderRadius: "20px",
          padding: "2px 8px", fontSize: "10px", fontWeight: 600,
          color: "var(--accent-dark, #D47A95)",
        }}>
          {Math.round(rec.score * 100)}% match
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.4, color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {rec.title}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
            ${rec.price.toFixed(2)}
          </span>
          {rec.condition && (
            <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-dim)", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: "20px" }}>
              {rec.condition.replace("_", " ").toUpperCase()}
            </span>
          )}
        </div>

        {/* Reason tag */}
        <div style={{ fontSize: "10px", color: "var(--accent-dark, #D47A95)", background: "var(--accent-dim)", padding: "4px 8px", borderRadius: "6px", fontWeight: 500 }}>
          ✦ {rec.reason}
        </div>

        <a
          href={rec.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          style={{
            display: "block",
            marginTop: "auto",
            textAlign: "center",
            fontFamily: "'Poppins', sans-serif",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "#fff",
            background: "var(--accent)",
            border: "none",
            borderRadius: "8px",
            padding: "8px",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
          className="view-link"
        >
          View Listing
        </a>
      </div>

      <style jsx>{`
        .view-link:hover {
          background: var(--accent-dark, #D47A95) !important;
          box-shadow: 0 2px 8px var(--glow);
        }
      `}</style>
    </div>
  );
}

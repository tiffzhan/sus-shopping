// file: app/(dashboard)/recommendations/page.tsx
// Scaffold for future ML-based recommender system.
// Events are tracked via /api/events and stored in the DB.
// This page will be powered by user event history once the recommender is built.

export default function RecommendationsPage() {
  return (
    <div style={{ padding: "32px 40px", maxWidth: "960px" }}>
      <div style={{ marginBottom: "32px" }}>
        <div className="sigil" style={{ marginBottom: "8px" }}>◉ RECOMMENDATIONS</div>
        <h1 style={{ fontSize: "24px", margin: 0 }}>RECOMMENDATIONS</h1>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          padding: "60px 40px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Corner decorations */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "30px", height: "30px", borderTop: "2px solid var(--border-bright)", borderLeft: "2px solid var(--border-bright)" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "30px", height: "30px", borderBottom: "2px solid var(--border-bright)", borderRight: "2px solid var(--border-bright)" }} />

        <div style={{ fontSize: "40px", marginBottom: "20px", opacity: 0.15, fontFamily: "'Orbitron', monospace" }}>◉</div>
        <h2 style={{ fontSize: "16px", color: "var(--text-dim)", marginBottom: "16px" }}>
          NOT YET IMPLEMENTED
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "12px", maxWidth: "480px", margin: "0 auto 24px", lineHeight: 1.7 }}>
          The recommendation engine is being designed. User actions (views, saves, dismissals,
          wishlist additions) are already being logged to{" "}
          <code style={{ background: "var(--surface2)", padding: "1px 6px", border: "1px solid var(--border)" }}>
            /api/events
          </code>{" "}
          and stored in the database for future model training.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          {[
            { label: "EVENT LOGGING", status: "✓ ACTIVE", desc: "All user actions tracked" },
            { label: "DATA MODEL", status: "✓ READY", desc: "Events table in DB" },
            { label: "ML ENGINE", status: "— PENDING", desc: "Not yet built" },
            { label: "PERSONALIZATION", status: "— PENDING", desc: "Requires training data" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                border: "1px solid var(--border)",
                padding: "16px",
                textAlign: "left",
              }}
            >
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "4px" }}>
                {item.label}
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "11px", color: item.status.startsWith("✓") ? "var(--text)" : "var(--text-muted)", marginBottom: "4px" }}>
                {item.status}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Future API scaffold reference */}
      <div style={{ marginTop: "24px", border: "1px solid var(--border)", padding: "20px" }}>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "12px" }}>
          FUTURE API ENDPOINTS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            "GET /api/recommendations — personalized listings for current user",
            "GET /api/recommendations/similar?listingId=x — similar item recommendations",
            "POST /api/events — log user actions for model training (✓ live)",
          ].map((line) => (
            <code
              key={line}
              style={{
                display: "block",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                padding: "8px 12px",
                fontSize: "11px",
                color: line.includes("✓") ? "var(--text-dim)" : "var(--text-muted)",
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              {line}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}

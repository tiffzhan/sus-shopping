import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const saved = await prisma.savedListing.findMany({
    where: { userId },
    include: { searchResult: true },
    orderBy: { savedAt: "desc" },
  });

  return (
    <div style={{ padding: "32px 40px", maxWidth: "960px" }}>
      <div style={{ marginBottom: "32px" }}>
        <div className="sigil" style={{ marginBottom: "8px" }}>◈ SAVED LISTINGS</div>
        <h1 style={{ fontSize: "24px", margin: 0 }}>SAVED LISTINGS</h1>
        <p style={{ color: "var(--text-dim)", fontSize: "12px", marginTop: "6px" }}>
          {saved.length} LISTING{saved.length !== 1 ? "S" : ""}
        </p>
      </div>

      {saved.length === 0 ? (
        <div style={{ border: "1px dashed var(--border)", padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.3 }}>☆</div>
          <p style={{ color: "var(--text-dim)" }}>NO SAVED LISTINGS YET</p>
          <p style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            Star listings from search results to save them here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {saved.map(({ id, savedAt, searchResult: r }) => (
            <div key={id} className="card" style={{ overflow: "hidden" }}>
              {/* Image */}
              <div style={{ aspectRatio: "4/3", background: "var(--surface2)", overflow: "hidden" }}>
                {r.imageUrl ? (
                  <img
                    src={r.imageUrl}
                    alt={r.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px 12px 0 0" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "'Poppins', sans-serif", fontSize: "10px" }}>
                    NO IMAGE
                  </div>
                )}
              </div>

              <div style={{ padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "9px", fontFamily: "'Poppins', sans-serif", letterSpacing: "0.1em", color: "var(--text-muted)", border: "1px solid var(--border)", padding: "1px 5px" }}>
                    {r.marketplace.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: "14px", fontWeight: 700 }}>
                    ${r.price.toFixed(2)}
                  </span>
                </div>

                <p style={{ margin: "0 0 10px", fontSize: "12px", lineHeight: 1.4, color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.title}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  {r.condition && (
                    <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                      {r.condition.replace("_", " ").toUpperCase()}
                    </span>
                  )}
                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                    SAVED {new Date(savedAt).toLocaleDateString()}
                  </span>
                </div>

                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
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
                >
                  VIEW ON {r.marketplace.toUpperCase()} ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

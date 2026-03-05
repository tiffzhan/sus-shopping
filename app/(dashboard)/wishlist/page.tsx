// file: app/(dashboard)/wishlist/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      trackedItem: {
        include: {
          searchResults: { orderBy: { score: "desc" }, take: 3 },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return (
    <div style={{ padding: "32px 40px", maxWidth: "960px" }}>
      <div style={{ marginBottom: "32px" }}>
        <div className="sigil" style={{ marginBottom: "8px" }}>◇ WISHLIST</div>
        <h1 style={{ fontSize: "24px", margin: 0 }}>WISHLIST</h1>
        <p style={{ color: "var(--text-dim)", fontSize: "12px", marginTop: "6px" }}>
          {wishlistItems.length} ITEM{wishlistItems.length !== 1 ? "S" : ""}
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div style={{ border: "1px dashed var(--border)", padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.3 }}>◇</div>
          <p style={{ color: "var(--text-dim)", marginBottom: "24px" }}>NO WISHLIST ITEMS YET</p>
          <Link href="/dashboard">
            <button className="btn-primary">← VIEW TRACKED ITEMS</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {wishlistItems.map((wl) => {
            const item = wl.trackedItem;
            const topResult = item.searchResults[0];
            return (
              <div key={wl.id} className="card" style={{ padding: "20px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <Link
                        href={`/tracked/${item.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                          {item.title}
                        </span>
                      </Link>
                      {wl.newMatchCount > 0 && (
                        <span className="badge badge-new">{wl.newMatchCount} NEW</span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {item.brand && <SmallTag>{item.brand}</SmallTag>}
                      {item.size && <SmallTag>SZ {item.size}</SmallTag>}
                      {item.maxPrice && <SmallTag>≤ ${item.maxPrice}</SmallTag>}
                    </div>

                    {/* Top result preview */}
                    {topResult && (
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em", marginBottom: "6px" }}>
                          TOP MATCH
                        </div>
                        <a
                          href={topResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "var(--text-dim)", fontSize: "12px" }}
                        >
                          {topResult.title.substring(0, 80)}{topResult.title.length > 80 ? "..." : ""}{" "}
                          <span style={{ fontFamily: "'Orbitron', monospace", color: "var(--text)" }}>
                            ${topResult.price.toFixed(2)} ↗
                          </span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em", marginBottom: "4px" }}>
                      ADDED
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                      {new Date(wl.addedAt).toLocaleDateString()}
                    </div>
                    <div style={{ marginTop: "12px" }}>
                      <Link href={`/tracked/${item.id}`}>
                        <button className="btn-ghost" style={{ fontSize: "9px", padding: "6px 12px" }}>
                          VIEW →
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SmallTag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "9px", fontFamily: "'Orbitron', monospace", letterSpacing: "0.08em", color: "var(--text-dim)", border: "1px solid var(--border)", padding: "1px 6px" }}>
      {children}
    </span>
  );
}

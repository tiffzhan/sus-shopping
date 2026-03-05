// file: app/(dashboard)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TrackedItemCard from "@/components/TrackedItemCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id as string;

  const [trackedItems, wishlistCount, savedCount] = await Promise.all([
    prisma.trackedItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { searchResults: true } },
        wishlistItems: { where: { userId }, select: { newMatchCount: true } },
      },
    }),
    prisma.wishlistItem.count({ where: { userId } }),
    prisma.savedListing.count({ where: { userId } }),
  ]);

  const totalNew = trackedItems.reduce(
    (sum, item) => sum + (item.wishlistItems[0]?.newMatchCount ?? 0),
    0
  );

  return (
    <div style={{ padding: "32px 40px", maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div className="sigil" style={{ marginBottom: "8px" }}>
          ◈ DASHBOARD ◈ {new Date().toISOString().split("T")[0]}
        </div>
        <h1 style={{ fontSize: "24px", margin: 0 }}>TRACKED ITEMS</h1>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "40px",
        }}
      >
        {[
          { label: "TRACKED", value: trackedItems.length },
          { label: "WISHLIST", value: wishlistCount },
          { label: "NEW MATCHES", value: totalNew },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card bracket"
            style={{ padding: "20px", textAlign: "center" }}
          >
            <div
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "4px",
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tracked items list */}
      {trackedItems.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--border)",
            padding: "60px 40px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.3 }}>◎</div>
          <p style={{ color: "var(--text-dim)", marginBottom: "24px" }}>
            NO TRACKED ITEMS YET
          </p>
          <Link href="/tracked/new">
            <button className="btn-primary">+ TRACK YOUR FIRST ITEM</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {trackedItems.map((item) => (
            <TrackedItemCard
              key={item.id}
              item={item}
              newMatchCount={item.wishlistItems[0]?.newMatchCount ?? 0}
              resultCount={item._count.searchResults}
            />
          ))}
        </div>
      )}
    </div>
  );
}

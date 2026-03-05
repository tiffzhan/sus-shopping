import Link from "next/link";

interface Props {
  item: {
    id: string;
    title: string;
    brand?: string | null;
    size?: string | null;
    color?: string | null;
    maxPrice?: number | null;
    condition?: string | null;
    category: string;
    notifyMe: boolean;
    lastSearchedAt?: Date | null;
  };
  newMatchCount: number;
  resultCount: number;
}

const CONDITION_LABELS: Record<string, string> = {
  new: "NEW",
  like_new: "LIKE NEW",
  good: "GOOD",
  fair: "FAIR",
};

export default function TrackedItemCard({ item, newMatchCount, resultCount }: Props) {
  return (
    <Link href={`/tracked/${item.id}`} style={{ textDecoration: "none" }}>
      <div
        className="card glitch"
        style={{
          padding: "18px 22px",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: "16px",
          cursor: "pointer",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {item.title}
            </span>
            {newMatchCount > 0 && (
              <span className="badge badge-new">
                {newMatchCount} NEW
              </span>
            )}
            {item.notifyMe && (
              <span title="Notifications on" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                ◉
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
            }}
          >
            {item.brand && <Tag value={item.brand} />}
            {item.size && <Tag value={`SZ ${item.size}`} />}
            {item.color && <Tag value={item.color} />}
            {item.maxPrice && <Tag value={`≤ $${item.maxPrice}`} />}
            {item.condition && <Tag value={CONDITION_LABELS[item.condition] ?? item.condition} />}
            <Tag value={item.category.toUpperCase()} dim />
          </div>

          {item.lastSearchedAt && (
            <div style={{ marginTop: "8px", fontSize: "10px", color: "var(--text-muted)" }}>
              LAST SEARCHED {formatRelative(item.lastSearchedAt)}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: resultCount > 0 ? "var(--text)" : "var(--text-muted)",
            }}
          >
            {resultCount}
          </div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            RESULTS
          </div>
        </div>
      </div>
    </Link>
  );
}

function Tag({ value, dim }: { value: string; dim?: boolean }) {
  return (
    <span
      style={{
        fontSize: "9px",
        fontFamily: "'Poppins', sans-serif",
        letterSpacing: "0.08em",
        color: dim ? "var(--text-muted)" : "var(--text-dim)",
        border: `1px solid ${dim ? "var(--border)" : "var(--border-bright)"}`,
        padding: "1px 6px",
      }}
    >
      {value}
    </span>
  );
}

function formatRelative(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h AGO`;
  return `${Math.floor(hours / 24)}d AGO`;
}

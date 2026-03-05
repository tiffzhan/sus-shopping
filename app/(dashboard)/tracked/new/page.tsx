"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = ["tops", "bottoms", "outerwear", "shoes", "accessories", "bags", "other"];
const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function NewTrackedItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    brand: "",
    size: "",
    color: "",
    keywords: "",
    maxPrice: "",
    condition: "",
    category: "tops",
    notes: "",
    notifyMe: false,
  });

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title) { setError("Title is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/tracked-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to create item");
        setLoading(false);
        return;
      }
      const item = await res.json();
      router.push(`/tracked/${item.id}`);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: "640px" }}>
      <div style={{ marginBottom: "32px" }}>
        <div className="sigil" style={{ marginBottom: "8px" }}>
          <Link href="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            ← DASHBOARD
          </Link>
        </div>
        <h1 style={{ fontSize: "22px", margin: 0 }}>TRACK NEW ITEM</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-row">
          <Field label="ITEM TITLE *" required>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Arc'teryx Beta LT Jacket"
              required
            />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="BRAND">
            <input value={form.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Arc'teryx" />
          </Field>
          <Field label="CATEGORY *">
            <select value={form.category} onChange={(e) => update("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <Field label="SIZE">
            <input value={form.size} onChange={(e) => update("size", e.target.value)} placeholder="M / 32 / 10" />
          </Field>
          <Field label="COLOR">
            <input value={form.color} onChange={(e) => update("color", e.target.value)} placeholder="Black" />
          </Field>
          <Field label="MAX PRICE ($)">
            <input
              type="number"
              value={form.maxPrice}
              onChange={(e) => update("maxPrice", e.target.value)}
              placeholder="350"
              min="0"
            />
          </Field>
        </div>

        <Field label="CONDITION">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[{ value: "", label: "ANY" }, ...CONDITIONS].map((c) => (
              <button
                key={c.value}
                type="button"
                style={{
                  padding: "6px 14px",
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  background: form.condition === c.value ? "var(--accent)" : "transparent",
                  color: form.condition === c.value ? "#000" : "var(--text-dim)",
                  border: `1px solid ${form.condition === c.value ? "var(--accent)" : "var(--border)"}`,
                  transition: "all 0.15s",
                }}
                onClick={() => update("condition", c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="KEYWORDS">
          <input
            value={form.keywords}
            onChange={(e) => update("keywords", e.target.value)}
            placeholder="arcteryx beta lt goretex shell"
          />
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
            Space-separated search terms to improve matching
          </div>
        </Field>

        <Field label="NOTES">
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Accepting black or grey only. No fakes."
            rows={3}
            style={{ resize: "vertical" }}
          />
        </Field>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label className="toggle-wrap">
            <input
              type="checkbox"
              checked={form.notifyMe}
              onChange={(e) => update("notifyMe", e.target.checked)}
              style={{ width: "auto" }}
            />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: form.notifyMe ? "var(--text)" : "var(--text-dim)",
              }}
            >
              NOTIFY ME ABOUT NEW MATCHES
            </span>
          </label>
        </div>

        {error && (
          <div style={{ border: "1px solid #333", padding: "10px", color: "#aaa", fontSize: "12px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "CREATING..." : "CREATE + SEARCH"}
          </button>
          <Link href="/dashboard">
            <button type="button" className="btn-ghost">CANCEL</button>
          </Link>
        </div>
      </form>

      <style jsx>{`
        .toggle-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .toggle-wrap input[type="checkbox"] {
          accent-color: white;
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "9px",
          letterSpacing: "0.15em",
          color: "var(--text-dim)",
        }}
      >
        {label} {required && <span style={{ color: "#888" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// file: components/Nav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavProps {
  user: { name?: string | null; email?: string | null };
}

const NAV_LINKS = [
  { href: "/dashboard", label: "DASHBOARD", icon: "⬡" },
  { href: "/wishlist", label: "WISHLIST", icon: "◇" },
  { href: "/saved", label: "SAVED", icon: "◈" },
  { href: "/recommendations", label: "RECS", icon: "◉" },
  { href: "/settings", label: "SETTINGS", icon: "◌" },
];

export default function Nav({ user }: NavProps) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "220px",
        height: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <div className="sigil" style={{ marginBottom: "4px", fontSize: "9px" }}>◈ SYSTEM ◈</div>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <h2
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "16px",
              letterSpacing: "0.1em",
              color: "var(--text)",
              margin: 0,
            }}
          >
            SUS
          </h2>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>
            SHOPPING
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <div style={{ flex: 1, padding: "16px 0" }}>
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 20px",
                textDecoration: "none",
                color: active ? "var(--text)" : "var(--text-dim)",
                background: active ? "var(--accent-dim)" : "transparent",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                fontFamily: "'Orbitron', monospace",
                fontSize: "10px",
                letterSpacing: "0.12em",
                transition: "all 0.15s",
              }}
              className="nav-link"
            >
              <span style={{ fontSize: "14px", opacity: active ? 1 : 0.5 }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* New tracked item CTA */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <Link href="/tracked/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ width: "100%", fontSize: "10px" }}>
            + TRACK ITEM
          </button>
        </Link>
      </div>

      {/* User info + logout */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.email}
        </div>
        <button
          className="btn-ghost"
          style={{ width: "100%", fontSize: "9px" }}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          SIGN OUT
        </button>
      </div>

      <style jsx>{`
        .nav-link:hover {
          color: var(--text) !important;
          background: var(--accent-dim) !important;
        }
      `}</style>
    </nav>
  );
}

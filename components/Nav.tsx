"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavProps {
  user: { name?: string | null; email?: string | null };
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/wishlist", label: "Wishlist", icon: "heart" },
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/recommendations", label: "For You", icon: "sparkle" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

const ICONS: Record<string, string> = {
  grid: "\u229E",
  heart: "\u2661",
  bookmark: "\u25C7",
  sparkle: "\u2726",
  gear: "\u2699",
};

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
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center"}}>
          <Image
            src="/sus_logo.jpg"
            alt="SUS Shopping"
            width={99}
            height={99}
            style={{ marginBottom: "4px" }}
            priority
          />
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
              letterSpacing: "0.04em",
            }}
          >
            SUS
          </h2>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.2em", fontWeight: 500 }}>
            SHOPPING
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <div style={{ flex: 1, padding: "12px 0" }}>
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
                padding: "11px 20px",
                textDecoration: "none",
                color: active ? "#D47A95" : "var(--text-dim)",
                background: active ? "var(--accent-dim)" : "transparent",
                borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "12px",
                fontWeight: active ? 600 : 400,
                letterSpacing: "0.04em",
                transition: "all 0.15s",
                borderRadius: "0",
              }}
              className="nav-link"
            >
              <span style={{ fontSize: "15px", opacity: active ? 1 : 0.5 }}>{ICONS[link.icon]}</span>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* New tracked item CTA */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <Link href="/tracked/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ width: "100%", fontSize: "10px", borderRadius: "8px" }}>
            + Track Item
          </button>
        </Link>
      </div>

      {/* User info + logout */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Poppins', sans-serif" }}>
          {user.email}
        </div>
        <button
          className="btn-ghost"
          style={{ width: "100%", fontSize: "9px", borderRadius: "8px" }}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign Out
        </button>
      </div>

      <style jsx>{`
        .nav-link:hover {
          color: var(--accent) !important;
          background: var(--accent-dim) !important;
        }
      `}</style>
    </nav>
  );
}

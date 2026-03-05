// file: app/(dashboard)/settings/page.tsx
"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: "640px" }}>
      <div style={{ marginBottom: "32px" }}>
        <div className="sigil" style={{ marginBottom: "8px" }}>◌ SETTINGS</div>
        <h1 style={{ fontSize: "24px", margin: 0 }}>SETTINGS</h1>
      </div>

      {/* Account */}
      <Section label="ACCOUNT">
        <Row label="EMAIL">{session?.user?.email ?? "—"}</Row>
        <Row label="NAME">{session?.user?.name ?? "Not set"}</Row>
        <Row label="USER ID">
          <code style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--surface2)", padding: "2px 6px", border: "1px solid var(--border)" }}>
            {session?.user?.id ?? "—"}
          </code>
        </Row>
      </Section>

      {/* Notifications */}
      <Section label="NOTIFICATIONS">
        <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px", lineHeight: 1.6 }}>
          Email notifications are a stub — configure your email provider to enable them.
        </div>
        <div
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            padding: "16px",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "11px",
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "8px" }}>
            TO ENABLE EMAIL NOTIFICATIONS:
          </div>
          1. Add SMTP credentials to .env.local:<br />
          &nbsp;&nbsp;SMTP_HOST=smtp.yourprovider.com<br />
          &nbsp;&nbsp;SMTP_PORT=587<br />
          &nbsp;&nbsp;SMTP_USER=you@example.com<br />
          &nbsp;&nbsp;SMTP_PASS=yourpassword<br />
          &nbsp;&nbsp;SMTP_FROM=noreply@sus.shopping<br />
          <br />
          2. Implement the sendNotificationEmail() function<br />
          &nbsp;&nbsp;in lib/notifications.ts (stub exists)<br />
          <br />
          3. Uncomment the email call in lib/search.ts
        </div>
      </Section>

      {/* Marketplace preferences */}
      <Section label="MARKETPLACE API KEYS">
        <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px", lineHeight: 1.6 }}>
          Set these in your <code style={{ background: "var(--surface2)", padding: "1px 4px", border: "1px solid var(--border)" }}>.env.local</code> file.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { key: "EBAY_CLIENT_ID", label: "eBay Client ID", status: "Required for live search", url: "https://developer.ebay.com/my/keys" },
            { key: "EBAY_CLIENT_SECRET", label: "eBay Client Secret", status: "Required for live search", url: "https://developer.ebay.com/my/keys" },
          ].map((item) => (
            <div key={item.key} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", padding: "12px", border: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "0.1em", marginBottom: "3px" }}>{item.label}</div>
                <code style={{ fontSize: "10px", color: "var(--text-muted)" }}>{item.key}</code>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{item.status}</div>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  alignSelf: "center",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "9px",
                  color: "var(--text-dim)",
                  border: "1px solid var(--border)",
                  padding: "5px 10px",
                  textDecoration: "none",
                  letterSpacing: "0.1em",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                GET KEYS ↗
              </a>
            </div>
          ))}
        </div>
      </Section>

      {/* Cron */}
      <Section label="BACKGROUND REFRESH">
        <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px", lineHeight: 1.6 }}>
          Automatically refresh all tracked items on a schedule.
        </div>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", padding: "16px", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.8 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "8px" }}>VERCEL CRON (vercel.json):</div>
          {'{'}<br />
          &nbsp;&nbsp;"crons": [{'{'}<br />
          &nbsp;&nbsp;&nbsp;&nbsp;"path": "/api/refresh",<br />
          &nbsp;&nbsp;&nbsp;&nbsp;"schedule": "0 */6 * * *"<br />
          &nbsp;&nbsp;{'}'}]<br />
          {'}'}
        </div>
        <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--text-muted)" }}>
          Also set <code style={{ background: "var(--surface2)", padding: "1px 4px", border: "1px solid var(--border)" }}>CRON_SECRET</code> in .env.local to protect the endpoint.
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-dim)", borderBottom: "1px solid var(--border)", paddingBottom: "8px", marginBottom: "16px" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-muted)", paddingTop: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "12px", color: "var(--text)" }}>{children}</div>
    </div>
  );
}

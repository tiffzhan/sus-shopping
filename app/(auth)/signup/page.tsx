// file: app/(auth)/signup/page.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }
      await signIn("credentials", { email, password, redirect: false });
      router.push("/dashboard");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container fade-up">
        <div className="auth-logo">
          <span className="sigil">◈ SUS.SHOPPING ◈</span>
          <h1 style={{ fontSize: "28px", marginTop: "8px" }}>NEW USER</h1>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>NAME (OPTIONAL)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hunter S. Thompson"
            />
          </div>
          <div className="field">
            <label>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label>PASSWORD (MIN 8 CHARS)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "INITIALIZING..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="auth-footer">
          EXISTING USER?{" "}
          <Link href="/login" style={{ color: "var(--text)", borderBottom: "1px solid var(--border-bright)" }}>
            SIGN IN →
          </Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          z-index: 1;
        }
        .auth-container {
          width: 100%;
          max-width: 380px;
          border: 1px solid var(--border-bright);
          padding: 40px;
          background: var(--surface);
          position: relative;
        }
        .auth-container::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 20px; height: 20px;
          border-top: 2px solid var(--accent);
          border-left: 2px solid var(--accent);
        }
        .auth-container::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 20px; height: 20px;
          border-bottom: 2px solid var(--accent);
          border-right: 2px solid var(--accent);
        }
        .auth-logo { text-align: center; margin-bottom: 32px; }
        .auth-form { display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label {
          font-family: 'Orbitron', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--text-dim);
        }
        .auth-error {
          color: #aaa; font-size: 12px;
          border: 1px solid #333;
          padding: 8px; text-align: center;
        }
        .auth-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}

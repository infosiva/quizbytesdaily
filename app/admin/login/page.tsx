"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const from = searchParams.get("from") ?? "/admin";
        router.push(from);
      } else {
        const json = await res.json();
        setError(json.error ?? "Incorrect password");
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#111118", border: "1px solid #1e1e2e", borderRadius: 14,
        padding: "2.5rem 2rem", width: "100%", maxWidth: 380,
      }}>
        {/* Logo + branding */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: "#a855f720",
            border: "1px solid #a855f740", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 24, margin: "0 auto 14px",
          }}>
            🔐
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#e2e8f0", margin: 0 }}>
            Admin Access
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#475569", marginTop: 6 }}>
            QuizBytesDaily Control Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", color: "#94a3b8", marginBottom: 6 }}>
              Password
            </label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
              style={{
                width: "100%", padding: "0.6rem 0.75rem",
                background: "#0a0a0f", border: "1px solid #1e1e2e",
                borderRadius: 8, color: "#e2e8f0", fontSize: "1rem",
                outline: "none", boxSizing: "border-box",
                borderColor: error ? "#f87171" : "#1e1e2e",
              }}
              onFocus={(e) => (e.target.style.borderColor = error ? "#f87171" : "#a855f7")}
              onBlur={(e) => (e.target.style.borderColor = error ? "#f87171" : "#1e1e2e")}
            />
            {error && (
              <p style={{ fontSize: "0.8rem", color: "#f87171", marginTop: 6 }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              padding: "0.65rem", background: loading || !password ? "#a855f750" : "#a855f7",
              border: "none", borderRadius: 8, color: "#fff", fontSize: "1rem",
              fontWeight: 700, cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Checking…" : "Login →"}
          </button>
        </form>

        {/* Back to public site */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.78rem", color: "#374151" }}>
          <a href="/" style={{ color: "#a855f7", textDecoration: "none" }}>
            ← Back to public site
          </a>
        </p>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams requires it in Next.js 15
export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

"use client";
import { useEffect, useState } from "react";

const KEY = "cookie_consent_v1";
type G = { gtag?: (...a: unknown[]) => void };

function setConsent(v: "accepted" | "declined") {
  try { localStorage.setItem(KEY, v); } catch {}
  (window as G).gtag?.("consent", "update", { analytics_storage: v === "accepted" ? "granted" : "denied" });
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const c = localStorage.getItem(KEY);
      if (!c) setShow(true);
      else if (c === "accepted") (window as G).gtag?.("consent", "update", { analytics_storage: "granted" });
    } catch {}
  }, []);
  if (!show) return null;
  const done = (v: "accepted" | "declined") => { setConsent(v); setShow(false); };
  return (
    <div role="dialog" aria-label="Cookie consent" style={{ position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 60, maxWidth: 560, marginInline: "auto", background: "var(--surface)", color: "var(--fg)", border: "1px solid var(--line)", borderRadius: "var(--layout-radius)", padding: 16, boxShadow: "0 12px 40px rgba(0,0,0,.45)" }}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--fg-dim)" }}>
        We use anonymous analytics (only if you accept) to see which layouts and pages work. No personal data.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => done("accepted")} style={{ minHeight: 44, padding: "0 18px", borderRadius: 10, border: 0, background: "var(--accent)", color: "var(--on-accent)", fontWeight: 700, cursor: "pointer" }}>Accept</button>
        <button onClick={() => done("declined")} style={{ minHeight: 44, padding: "0 18px", borderRadius: 10, border: "1px solid var(--line)", background: "transparent", color: "var(--fg)", cursor: "pointer" }}>Decline</button>
      </div>
    </div>
  );
}

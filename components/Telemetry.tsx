"use client";
// Consent-gated usage logging + structured error log. Free tier: GA4 (only if hub set analytics.ga4Id)
// and console JSON. Nothing is sent before cookie_consent_v1 === "accepted". No personal data.
import { useEffect } from "react";

const KEY = "cookie_consent_v1";
type G = { gtag?: (...a: unknown[]) => void };

function consented() {
  try { return localStorage.getItem(KEY) === "accepted"; } catch { return false; }
}

export function logError(kind: string, message: string, extra?: Record<string, unknown>) {
  // structured error log: one JSON line, greppable in Vercel logs / devtools
  console.error(JSON.stringify({ level: "error", kind, message: String(message).slice(0, 300), path: location.pathname, t: new Date().toISOString(), ...extra }));
  if (consented()) (window as G).gtag?.("event", "exception", { description: `${kind}:${String(message).slice(0, 100)}`, fatal: false });
}

export function Telemetry({ archetype }: { archetype: string }) {
  useEffect(() => {
    const onErr = (e: ErrorEvent) => logError("window.error", e.message, { src: e.filename, line: e.lineno });
    const onRej = (e: PromiseRejectionEvent) => logError("unhandledrejection", String(e.reason?.message ?? e.reason));
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    if (consented()) (window as G).gtag?.("event", "layout_view", { archetype, path: location.pathname });
    return () => { window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onRej); };
  }, [archetype]);
  return null;
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SiteSettings {
  gridColumns:   2 | 3 | 4;
  defaultView:   "grid" | "list";
  pageSize:      8 | 12 | 16 | 24;
  heroEnabled:   boolean;
  showDashboard: boolean;
}

const BG   = "#0a0a10";
const CARD = "#111118";
const BORD = "#1e1e2e";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    gridColumns: 3, defaultView: "grid", pageSize: 12, heroEnabled: true, showDashboard: true,
  });
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [error,  setError]    = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d: SiteSettings) => setSettings(d))
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const row = (label: string, desc: string, control: React.ReactNode) => (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "1rem 0", borderBottom: `1px solid ${BORD}` }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{label}</div>
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );

  const chips = <T extends string | number>(
    options: { label: string; value: T }[],
    current: T,
    onChange: (v: T) => void,
  ) => (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map(({ label, value }) => (
        <button key={String(value)} onClick={() => onChange(value)}
          style={{
            padding: "4px 12px", borderRadius: 6, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            background: current === value ? "#a855f7" : "#1a1a2a",
            color:      current === value ? "#fff"    : "#64748b",
            border:     `1px solid ${current === value ? "#a855f7" : BORD}`,
            transition: "all 0.15s",
          }}>
          {label}
        </button>
      ))}
    </div>
  );

  const toggle = (on: boolean, onToggle: () => void) => (
    <button onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: on ? "#a855f7" : "#1e1e2e", position: "relative", transition: "background 0.2s",
      }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "#fff", transition: "left 0.2s",
      }} />
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "2rem" }}>
          <Link href="/admin"
            style={{ color: "#64748b", fontSize: "0.85rem", textDecoration: "none" }}>
            ← Admin
          </Link>
          <span style={{ color: BORD }}>·</span>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Public Page Settings</h1>
        </div>

        {/* Settings card */}
        <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 12, padding: "1rem 1.5rem" }}>

          {row(
            "Grid columns",
            "Number of video cards per row in grid view",
            chips(
              [{ label: "2", value: 2 }, { label: "3", value: 3 }, { label: "4", value: 4 }] as { label: string; value: 2 | 3 | 4 }[],
              settings.gridColumns,
              (v) => setSettings((s) => ({ ...s, gridColumns: v })),
            ),
          )}

          {row(
            "Default view",
            "Whether to open the library in grid or list mode by default",
            chips(
              [{ label: "Grid", value: "grid" }, { label: "List", value: "list" }] as { label: string; value: "grid" | "list" }[],
              settings.defaultView,
              (v) => setSettings((s) => ({ ...s, defaultView: v })),
            ),
          )}

          {row(
            "Page size",
            "Number of videos to show per page in the library",
            chips(
              [{ label: "8", value: 8 }, { label: "12", value: 12 }, { label: "16", value: 16 }, { label: "24", value: 24 }] as { label: string; value: 8 | 12 | 16 | 24 }[],
              settings.pageSize,
              (v) => setSettings((s) => ({ ...s, pageSize: v })),
            ),
          )}

          {row(
            "Show hero banner",
            "Display the 'One quiz. Every day.' hero section on the dashboard",
            toggle(settings.heroEnabled, () => setSettings((s) => ({ ...s, heroEnabled: !s.heroEnabled }))),
          )}

          {row(
            "Show Dashboard tab",
            "Allow users to access the Dashboard view from the sidebar",
            toggle(settings.showDashboard, () => setSettings((s) => ({ ...s, showDashboard: !s.showDashboard }))),
          )}

        </div>

        {/* Save button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "1.5rem" }}>
          <button onClick={save} disabled={saving}
            style={{
              padding: "10px 28px", borderRadius: 8, border: "none", cursor: saving ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff",
              fontWeight: 700, fontSize: "0.9rem", opacity: saving ? 0.7 : 1, transition: "opacity 0.15s",
            }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved  && <span style={{ fontSize: "0.85rem", color: "#4ade80", fontWeight: 600 }}>✓ Saved</span>}
          {error  && <span style={{ fontSize: "0.85rem", color: "#f87171" }}>{error}</span>}
        </div>

        <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: "#374151" }}>
          Changes take effect immediately — no rebuild needed.
          The public page fetches these settings on every load.
        </p>
      </div>
    </div>
  );
}

import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET /api/youtube/callback
// Handles the OAuth redirect from Google, exchanges the code for tokens,
// and shows the new YOUTUBE_REFRESH_TOKEN to copy into .env.local / Vercel.
export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return html(`<h2 style="color:#f87171">OAuth denied</h2><p>${error}</p>`);
  }
  if (!code) {
    return html(`<h2 style="color:#f87171">No code received</h2>`);
  }

  const origin      = req.nextUrl.origin;
  const redirectUri = `${origin}/api/youtube/callback`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      grant_type:    "authorization_code",
    }),
  });

  const data = await res.json();

  if (!data.refresh_token) {
    return html(
      `<h2 style="color:#f87171">Token exchange failed</h2>` +
      `<pre style="color:#94a3b8">${JSON.stringify(data, null, 2)}</pre>`
    );
  }

  return html(`
    <h2 style="color:#4ade80">✓ YouTube Authorized!</h2>
    <p>Copy this value and set it as <code>YOUTUBE_REFRESH_TOKEN</code>:</p>
    <pre style="background:#0f172a;padding:1rem;border-radius:8px;word-break:break-all;color:#22d3ee">${data.refresh_token}</pre>
    <p style="color:#94a3b8">
      • <strong>Local:</strong> paste into <code>.env.local</code> and restart the server<br>
      • <strong>Vercel:</strong> go to Settings → Environment Variables → update <code>YOUTUBE_REFRESH_TOKEN</code> → Redeploy
    </p>
    <a href="/admin" style="display:inline-block;margin-top:1rem;padding:0.6rem 1.4rem;background:#a855f7;border-radius:8px;color:#fff;text-decoration:none">← Back to Admin</a>
  `);
}

function html(body: string) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>YouTube Auth</title></head>` +
    `<body style="font-family:system-ui;background:#0a0a1f;color:#e2e8f0;padding:2rem;max-width:640px">${body}</body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

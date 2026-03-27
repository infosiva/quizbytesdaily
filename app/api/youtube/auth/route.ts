import { NextRequest } from "next/server";

export const runtime = "nodejs";

// GET /api/youtube/auth
// Redirects the admin to Google's OAuth consent screen.
// After approval, Google sends a code to /api/youtube/callback.
export async function GET(req: NextRequest) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  if (!clientId) {
    return new Response("YOUTUBE_CLIENT_ID not set", { status: 500 });
  }

  const origin      = req.nextUrl.origin;
  const redirectUri = `${origin}/api/youtube/callback`;
  const scope       = "https://www.googleapis.com/auth/youtube.upload";

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id",     clientId);
  authUrl.searchParams.set("redirect_uri",  redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope",         scope);
  authUrl.searchParams.set("access_type",   "offline");
  authUrl.searchParams.set("prompt",        "consent"); // force new refresh token

  return Response.redirect(authUrl.toString());
}

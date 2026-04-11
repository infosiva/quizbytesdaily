import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, deriveToken } from "@/lib/admin-auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD env var is not set");
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

// POST /api/admin/auth  — login
export async function POST(req: NextRequest) {
  try {
    const body     = await req.json();
    const password = String(body.password ?? "");

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const token    = await deriveToken(ADMIN_PASSWORD);
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, token, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET /api/admin/auth?action=logout  — clear session and redirect to login
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");
  if (action !== "logout") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const response = NextResponse.redirect(new URL("/admin/login", req.url));
  response.cookies.set(ADMIN_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return response;
}

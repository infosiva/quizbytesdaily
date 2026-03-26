import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, deriveToken } from "@/lib/admin-auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminUi  = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  // Pass through public routes
  if (!isAdminUi && !isAdminApi) return NextResponse.next();

  // Always allow the login page and the auth API endpoint (no auth needed for these)
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  const expectedToken   = await deriveToken(ADMIN_PASSWORD);
  const cookie          = request.cookies.get(ADMIN_COOKIE);
  const isAuthenticated = cookie?.value === expectedToken;

  // Authenticated — allow through
  if (isAuthenticated) return NextResponse.next();

  // Unauthenticated API request — 401 JSON
  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Unauthenticated UI request — redirect to /admin/login
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};

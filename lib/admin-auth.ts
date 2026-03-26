// Shared auth helpers — used by both middleware.ts and /api/admin/auth/route.ts

export const ADMIN_COOKIE = "qbd_admin_auth";

export async function deriveToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data    = encoder.encode(`qbd-session:${password}`);
  const hash    = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

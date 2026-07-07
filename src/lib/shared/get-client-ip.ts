import { type NextRequest } from "next/server";

/**
 * Extract client IP from the rightmost untrusted position in X-Forwarded-For,
 * or fall back to x-real-ip (Vercel edge-set, not client-controllable).
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[ips.length - 1] || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
}

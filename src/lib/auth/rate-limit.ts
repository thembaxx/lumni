import { type RateLimitConfig, RateLimiter } from "@/lib/rate-limiter/core";

const SIGNIN_CONFIG: RateLimitConfig = { max: 3, windowMs: 5 * 60 * 1000 };
const MAGIC_LINK_CONFIG: RateLimitConfig = { max: 1, windowMs: 5 * 60 * 1000 };

import { logError } from "@/lib/shared/logger";

const rateLimiter = new RateLimiter();

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; errorMessage: string; resetAt: number };

export async function attemptSignIn(email: string): Promise<RateLimitResult> {
  const key = normalizeEmail(email);

  try {
    // Server-side check via API route
    const res = await fetch("/api/auth/rate-limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "signin" }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    logError("RateLimit.SignInCheck", error);
  }

  // Fallback to in-memory RateLimiter
  const result = await rateLimiter.check(key, SIGNIN_CONFIG);
  if (!result.allowed) {
    const waitMinutes = Math.ceil((result.resetAt - Date.now()) / 60000);
    return {
      allowed: false,
      resetAt: result.resetAt,
      errorMessage: `Too many sign-in attempts. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
    };
  }
  return { allowed: true };
}

export async function recordSuccessfulSignIn(email: string): Promise<void> {
  const key = normalizeEmail(email);

  try {
    // Server-side logging of successful sign-in
    const res = await fetch("/api/auth/rate-limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "success" }),
    });
    if (res.ok) {
      rateLimiter.reset(key);
      return;
    }
  } catch (error) {
    logError("RateLimit.SignInSuccess", error);
  }

  // Fallback to in-memory RateLimiter
  rateLimiter.reset(key);
}

export async function attemptMagicLink(email: string): Promise<RateLimitResult> {
  const key = normalizeEmail(email);

  try {
    // Server-side check via API route
    const res = await fetch("/api/auth/rate-limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "magiclink" }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    logError("RateLimit.MagicLinkCheck", error);
  }

  // Fallback to in-memory RateLimiter
  const result = await rateLimiter.check(key, MAGIC_LINK_CONFIG);
  if (!result.allowed) {
    const waitMinutes = Math.ceil((result.resetAt - Date.now()) / 60000);
    return {
      allowed: false,
      resetAt: result.resetAt,
      errorMessage: `A magic link was already sent. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
    };
  }
  return { allowed: true };
}

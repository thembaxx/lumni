import { type NextRequest, NextResponse } from "next/server";
import type { RateLimitConfig } from "@/lib/rate-limiter/core";
import { logError } from "@/lib/shared/logger";
import { checkRateLimit, getRateLimitHeaders } from "./rate-limit";
import { getClientIp } from "./get-client-ip";

export type RouteHandler = (
  req: NextRequest,
) => Promise<NextResponse<unknown> | Response> | NextResponse<unknown> | Response;

export function withRateLimit(handler: RouteHandler, config?: RateLimitConfig): RouteHandler {
  const apiConfig = config ?? { max: 10, windowMs: 60 * 1000 };
  return async (req: NextRequest) => {
    const ip = getClientIp(req);

    let rateLimit: Awaited<ReturnType<typeof checkRateLimit>>;
    try {
      rateLimit = await checkRateLimit(ip, apiConfig);
    } catch (e) {
      logError("RateLimit", e);
      rateLimit = {
        allowed: true,
        remaining: 1,
        resetAt: Date.now() + apiConfig.windowMs,
      };
    }

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: getRateLimitHeaders(rateLimit) },
      );
    }

    const response = await handler(req);

    if (response.headers) {
      const rlHeaders = getRateLimitHeaders(rateLimit);
      for (const [key, value] of Object.entries(rlHeaders)) {
        response.headers.set(key, value);
      }
    }

    return response;
  };
}

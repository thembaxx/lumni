import { type NextRequest, NextResponse } from "next/server";
import type { RateLimitConfig } from "@/lib/rate-limiter/core";
import { checkRateLimit, getRateLimitHeaders } from "./rate-limit";

export type RouteHandler = (
	req: NextRequest,
) => Promise<NextResponse<unknown>> | NextResponse<unknown>;

export function withRateLimit(
	handler: RouteHandler,
	config?: RateLimitConfig,
): RouteHandler {
	const apiConfig = config ?? { max: 10, windowMs: 60 * 1000 };
	return async (req: NextRequest) => {
		const ip =
			req.headers.get("x-forwarded-for")?.split(",")[0] ||
			req.headers.get("x-real-ip") ||
			"unknown";

		const rateLimit = checkRateLimit(ip, apiConfig);

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

import { type NextRequest, NextResponse } from "next/server";
import { type AICallType, dailyCallTracker } from "./daily-call-tracker";

export async function checkBudget(
	req: NextRequest,
	type: AICallType,
	sessionUserId?: string | null,
): Promise<{
	allowed: boolean;
	response?: NextResponse;
	userId: string;
}> {
	const forwardedFor = req.headers.get("x-forwarded-for");
	if (forwardedFor?.includes(",")) {
		console.warn(
			"[Budget] Multiple X-Forwarded-For values detected:",
			forwardedFor,
		);
	}

	const userId =
		sessionUserId ||
		forwardedFor?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip")?.trim() ||
		"anonymous";

	const result = await dailyCallTracker.check(type, userId);

	if (!result.allowed) {
		return {
			allowed: false,
			userId,
			response: NextResponse.json(
				{
					error:
						"Daily generation limit reached. Your saved questions are still available.",
				},
				{
					status: 429,
					headers: {
						"X-Budget-Remaining-User": String(result.remaining.user),
						"X-Budget-Remaining-Global": String(result.remaining.global),
						"X-Budget-Reset": String(result.resetAt),
					},
				},
			),
		};
	}

	return { allowed: true, userId };
}

export async function trackUsage(
	type: AICallType,
	userId: string,
	tokens?: number,
): Promise<void> {
	await dailyCallTracker.increment(type, userId, tokens);
}

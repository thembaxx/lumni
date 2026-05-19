import { type NextRequest, NextResponse } from "next/server";
import { type AICallType, dailyCallTracker } from "./daily-call-tracker";

export async function checkBudget(
	req: NextRequest,
	type: AICallType,
): Promise<{
	allowed: boolean;
	response?: NextResponse;
	userId: string;
}> {
	const userId =
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip")?.trim() ||
		"anonymous";

	const result = dailyCallTracker.check(type, userId);

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

export function trackUsage(
	type: AICallType,
	userId: string,
	tokens?: number,
): void {
	dailyCallTracker.increment(type, userId, tokens);
}

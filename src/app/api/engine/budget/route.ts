import { dailyCallTracker } from "@/lib/ai/daily-call-tracker";
import { createRouteHandler } from "@/lib/api/create-route-handler";

export const dynamic = "force-dynamic";

export const GET = createRouteHandler({
	auth: "none",
	errorLabel: "Budget",
	execute: async ({ req }) => {
		const userId =
			req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			req.headers.get("x-real-ip")?.trim() ||
			"anonymous";

		const [usage, globalUsage] = await Promise.all([
			dailyCallTracker.getUsage(userId),
			dailyCallTracker.getGlobalUsage(),
		]);

		return {
			user: { id: userId, usage },
			global: globalUsage,
		};
	},
});

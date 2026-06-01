import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getInterGroupLeaderboard } from "@/lib/study-groups/challenge-service";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "Leaderboard",
	execute: async () => {
		const result = await getInterGroupLeaderboard();

		if (!result.success) {
			throw new HttpError(500, result.error);
		}

		return { leaderboard: result.data };
	},
});

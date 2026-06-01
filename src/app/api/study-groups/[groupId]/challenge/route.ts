import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
	getChallengeEntries,
	getOrCreateChallenge,
} from "@/lib/study-groups/challenge-service";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "GroupChallenge",
	execute: async ({ params }) => {
		const groupId = params?.groupId as string;

		const challengeResult = await getOrCreateChallenge(groupId);
		if (!challengeResult.success) {
			throw new HttpError(500, challengeResult.error);
		}

		const entriesResult = await getChallengeEntries(challengeResult.data.$id);
		const entries = entriesResult.success ? entriesResult.data : [];

		return {
			challenge: challengeResult.data,
			entries,
		};
	},
});

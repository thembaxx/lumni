import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
	createCustomChallenge,
	getChallengeEntries,
	getOrCreateChallenge,
} from "@/lib/study-groups/challenge-service";
import type { ChallengeType } from "@/lib/study-groups/challenge-types";

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

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "CreateChallenge",
	execute: async ({ params, body }) => {
		const groupId = params?.groupId as string;
		const { challengeType } = body as { challengeType: ChallengeType };

		if (!challengeType) {
			throw new HttpError(400, "challengeType is required");
		}

		const result = await createCustomChallenge(groupId, challengeType);
		if (!result.success) {
			throw new HttpError(500, result.error);
		}

		return { challenge: result.data };
	},
});

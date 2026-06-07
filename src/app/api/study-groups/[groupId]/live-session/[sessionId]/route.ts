import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
	endLiveSession,
	getLiveSession,
	getParticipants,
} from "@/lib/study-groups/live-session-service";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "LiveSession",
	execute: async ({ params }) => {
		const sessionId = params?.sessionId as string;
		const session = await getLiveSession(sessionId);
		if (!session) throw new HttpError(404, "Session not found");
		const participants = await getParticipants(sessionId);
		return { session, participants };
	},
});

export const PATCH = createRouteHandler({
	auth: "required",
	errorLabel: "LiveSession",
	execute: async ({ params }) => {
		const sessionId = params?.sessionId as string;
		const ok = await endLiveSession(sessionId);
		if (!ok) throw new HttpError(500, "Failed to end session");
		return { success: true };
	},
});

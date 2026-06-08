import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getAuthenticatedUserName } from "@/lib/server/auth";
import {
	getActiveSession,
	getParticipants,
	startLiveSession,
} from "@/lib/study-groups/live-session-service";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "LiveSession",
	execute: async ({ params }) => {
		const groupId = params?.groupId as string;
		const session = await getActiveSession(groupId);
		if (!session) return { session: null, participants: [] };
		const participants = await getParticipants(session.$id);
		return { session, participants };
	},
});

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "LiveSession",
	validate: (body: { subject?: string }) => {
		if (body.subject && typeof body.subject !== "string")
			return "subject must be a string";
		return null;
	},
	execute: async ({ userId, params, body }) => {
		const groupId = params?.groupId as string;
		const [userName, existing] = await Promise.all([
			getAuthenticatedUserName(),
			getActiveSession(groupId),
		]);
		if (existing) {
			throw new HttpError(
				409,
				"An active session already exists for this group",
			);
		}
		const session = await startLiveSession(
			groupId,
			userId as string,
			userName ?? undefined,
			(body as { subject?: string }).subject,
		);
		if (!session) throw new HttpError(500, "Failed to start session");
		return { session };
	},
});

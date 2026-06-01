import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
	checkSubjectStatus,
	refreshSubject,
	syncAllSubjects,
	syncSubject,
} from "@/lib/server/sync-actions";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const syncPostHandler = createRouteHandler({
	auth: "required",
	execute: async ({ body }) => {
		const { subject, action } = body as { subject?: string; action: string };

		switch (action) {
			case "sync": {
				if (!subject) throw new HttpError(400, "Missing subject");
				return await syncSubject(subject);
			}
			case "refresh": {
				if (!subject) throw new HttpError(400, "Missing subject");
				return await refreshSubject(subject);
			}
			case "check": {
				if (!subject) throw new HttpError(400, "Missing subject");
				return await checkSubjectStatus(subject);
			}
			case "sync-all":
				return await syncAllSubjects();
			default:
				throw new HttpError(400, "Unknown action");
		}
	},
	errorLabel: "Sync",
});

const syncGetHandler = createRouteHandler({
	auth: "required",
	execute: async ({ userId }) => {
		const lastSync =
			typeof localStorage !== "undefined"
				? localStorage.getItem(`lumni_last_sync_${userId}`)
				: null;

		return {
			status: "ok",
			lastSync: lastSync ? Number(lastSync) : null,
			pendingChanges: 0,
		};
	},
	errorLabel: "Sync",
});

export const POST = withRateLimit(syncPostHandler, { max: 5, windowMs: 60000 });
export const GET = withRateLimit(syncGetHandler, { max: 5, windowMs: 60000 });

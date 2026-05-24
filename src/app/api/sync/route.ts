import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import {
	checkSubjectStatus,
	refreshSubject,
	syncAllSubjects,
	syncSubject,
} from "@/lib/server/sync-actions";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function syncPostHandler(req: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
		const body = await req.json();
		const { subject, action } = body;

		switch (action) {
			case "sync": {
				if (!subject) {
					return NextResponse.json(
						{ error: "Missing subject" },
						{ status: 400 },
					);
				}
				const result = await syncSubject(subject);
				return NextResponse.json(result);
			}

			case "refresh": {
				if (!subject) {
					return NextResponse.json(
						{ error: "Missing subject" },
						{ status: 400 },
					);
				}
				const result = await refreshSubject(subject);
				return NextResponse.json(result);
			}

			case "check": {
				if (!subject) {
					return NextResponse.json(
						{ error: "Missing subject" },
						{ status: 400 },
					);
				}
				const result = await checkSubjectStatus(subject);
				return NextResponse.json(result);
			}

			case "sync-all": {
				const result = await syncAllSubjects();
				return NextResponse.json(result);
			}

			default:
				return NextResponse.json({ error: "Unknown action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Sync API error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 },
		);
	}
}

async function syncGetHandler(_req: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const lastSync =
		typeof localStorage !== "undefined"
			? localStorage.getItem(`lumni_last_sync_${userId}`)
			: null;

	return NextResponse.json({
		status: "ok",
		lastSync: lastSync ? Number(lastSync) : null,
		pendingChanges: 0,
	});
}

export const POST = withRateLimit(syncPostHandler, {
	max: 5,
	windowMs: 60000,
});

export const GET = withRateLimit(syncGetHandler, {
	max: 5,
	windowMs: 60000,
});

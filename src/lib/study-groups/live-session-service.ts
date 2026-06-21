import {
	COLLECTIONS,
	createDocument,
	getDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";
import type { LiveSession, LiveSessionParticipant } from "./live-session-types";

export async function startLiveSession(
	groupId: string,
	userId: string,
	userName?: string,
	subject?: string,
): Promise<LiveSession | null> {
	try {
		const id = await createDocument(COLLECTIONS.LIVE_SESSIONS, {
			groupId,
			startedBy: userId,
			startedByName: userName ?? "",
			subject: subject ?? "",
			status: "active",
			startedAt: new Date().toISOString(),
			participantCount: 1,
		});
		if (!id) return null;
		await createDocument(COLLECTIONS.LIVE_SESSION_PARTICIPANTS, {
			sessionId: id,
			userId,
			userName: userName ?? "",
			joinedAt: new Date().toISOString(),
			status: "active",
		});
		return getLiveSession(id);
	} catch (err) {
		logError("LiveSessionService.start", err);
		return null;
	}
}

export async function endLiveSession(sessionId: string): Promise<boolean> {
	try {
		await updateDocument(COLLECTIONS.LIVE_SESSIONS, sessionId, {
			status: "ended",
			endedAt: new Date().toISOString(),
		});
		return true;
	} catch (err) {
		logError("LiveSessionService.end", err);
		return false;
	}
}

export async function getLiveSession(
	sessionId: string,
): Promise<LiveSession | null> {
	try {
		return await getDocument<LiveSession>(COLLECTIONS.LIVE_SESSIONS, sessionId);
	} catch (e) {
		logError("LiveSession.get", e);
		return null;
	}
}

export async function getActiveSession(
	groupId: string,
): Promise<LiveSession | null> {
	try {
		const sessions = await listDocuments<LiveSession>(
			COLLECTIONS.LIVE_SESSIONS,
			[
				`equal("groupId", "${groupId}")`,
				`equal("status", "active")`,
				'orderDesc("startedAt")',
				"limit(1)",
			],
		);
		return sessions[0] ?? null;
	} catch (e) {
		logError("LiveSession.getActive", e);
		return null;
	}
}

export async function joinSession(
	sessionId: string,
	userId: string,
	userName?: string,
): Promise<boolean> {
	try {
		await createDocument(COLLECTIONS.LIVE_SESSION_PARTICIPANTS, {
			sessionId,
			userId,
			userName: userName ?? "",
			joinedAt: new Date().toISOString(),
			status: "active",
		});
		const session = await getDocument<LiveSession>(
			COLLECTIONS.LIVE_SESSIONS,
			sessionId,
		);
		if (session) {
			await updateDocument(COLLECTIONS.LIVE_SESSIONS, sessionId, {
				participantCount: (session.participantCount ?? 0) + 1,
			});
		}
		return true;
	} catch (err) {
		logError("LiveSessionService.join", err);
		return false;
	}
}

export async function leaveSession(
	sessionId: string,
	userId: string,
): Promise<boolean> {
	try {
		const participants = await listDocuments<LiveSessionParticipant>(
			COLLECTIONS.LIVE_SESSION_PARTICIPANTS,
			[
				`equal("sessionId", "${sessionId}")`,
				`equal("userId", "${userId}")`,
				`equal("status", "active")`,
				"limit(1)",
			],
		);
		if (participants[0]) {
			await updateDocument(
				COLLECTIONS.LIVE_SESSION_PARTICIPANTS,
				participants[0].$id,
				{ status: "left" },
			);
			const session = await getDocument<LiveSession>(
				COLLECTIONS.LIVE_SESSIONS,
				sessionId,
			);
			if (session) {
				await updateDocument(COLLECTIONS.LIVE_SESSIONS, sessionId, {
					participantCount: Math.max(0, (session.participantCount ?? 1) - 1),
				});
			}
		}
		return true;
	} catch (err) {
		logError("LiveSessionService.leave", err);
		return false;
	}
}

export async function getParticipants(
	sessionId: string,
): Promise<LiveSessionParticipant[]> {
	try {
		return await listDocuments<LiveSessionParticipant>(
			COLLECTIONS.LIVE_SESSION_PARTICIPANTS,
			[`equal("sessionId", "${sessionId}")`, `equal("status", "active")`],
		);
	} catch (e) {
		logError("LiveSession.getParticipants", e);
		return [];
	}
}

export async function updateActivity(
	sessionId: string,
	userId: string,
	activity: string,
): Promise<boolean> {
	try {
		const participants = await listDocuments<LiveSessionParticipant>(
			COLLECTIONS.LIVE_SESSION_PARTICIPANTS,
			[
				`equal("sessionId", "${sessionId}")`,
				`equal("userId", "${userId}")`,
				`equal("status", "active")`,
				"limit(1)",
			],
		);
		if (participants[0]) {
			await updateDocument(
				COLLECTIONS.LIVE_SESSION_PARTICIPANTS,
				participants[0].$id,
				{ currentActivity: activity },
			);
		}
		return true;
	} catch (err) {
		logError("LiveSessionService.updateActivity", err);
		return false;
	}
}

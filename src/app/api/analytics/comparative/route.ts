import { Query } from "appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import type { StudySession } from "@/lib/db/client";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 100;
const MAX_SESSIONS = 10000;

async function fetchAllSessions(): Promise<StudySession[]> {
	const allSessions: StudySession[] = [];
	let offset = 0;

	while (allSessions.length < MAX_SESSIONS) {
		const page = await listDocuments<StudySession>(COLLECTIONS.STUDY_SESSIONS, [
			Query.limit(PAGE_LIMIT),
			Query.offset(offset),
		]);
		allSessions.push(...page);
		if (page.length < PAGE_LIMIT) break;
		offset += PAGE_LIMIT;
	}

	return allSessions;
}

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "Comparative Analytics",
	execute: async ({ userId, req }) => {
		const { searchParams } = new URL(req.url);
		const requestedUserId = searchParams.get("userId");

		if (!requestedUserId) {
			throw new HttpError(400, "userId is required");
		}

		if (requestedUserId !== userId) {
			throw new HttpError(403, "Unauthorized");
		}

		const allSessions = await fetchAllSessions();

		let globalTotalAnswered = 0;
		let globalTotalCorrect = 0;
		const userTotals: Record<string, { answered: number; correct: number }> =
			{};

		for (const session of allSessions) {
			globalTotalAnswered += session.questionsAnswered;
			globalTotalCorrect += session.correctCount;
			if (!userTotals[session.userId]) {
				userTotals[session.userId] = { answered: 0, correct: 0 };
			}
			userTotals[session.userId].answered += session.questionsAnswered;
			userTotals[session.userId].correct += session.correctCount;
		}

		const globalAverage =
			globalTotalAnswered > 0
				? Math.round((globalTotalCorrect / globalTotalAnswered) * 100)
				: 65;

		const userTotal = userTotals[requestedUserId] || {
			answered: 0,
			correct: 0,
		};
		const userAverage =
			userTotal.answered > 0
				? (userTotal.correct / userTotal.answered) * 100
				: 0;

		const userAccuracy =
			userTotal.answered > 0 ? userTotal.correct / userTotal.answered : 0;
		const otherUsers = Object.entries(userTotals).filter(
			([id]) => id !== requestedUserId,
		);
		const usersBeaten = otherUsers.filter(
			([, data]) =>
				data.answered > 0 && data.correct / data.answered <= userAccuracy,
		).length;
		const userPercentile =
			otherUsers.length > 0
				? Math.round((usersBeaten / otherUsers.length) * 100)
				: 50;

		const userSessions = allSessions.filter(
			(s) => s.userId === requestedUserId,
		);
		const subjectStats: Record<string, { answered: number; correct: number }> =
			{};
		for (const session of userSessions) {
			if (!subjectStats[session.subjectId]) {
				subjectStats[session.subjectId] = { answered: 0, correct: 0 };
			}
			subjectStats[session.subjectId].answered += session.questionsAnswered;
			subjectStats[session.subjectId].correct += session.correctCount;
		}

		const subjectRankings: Record<string, number> = {};
		for (const [subject, stats] of Object.entries(subjectStats)) {
			subjectRankings[subject] =
				stats.answered > 0
					? Math.round((stats.correct / stats.answered) * 100)
					: 0;
		}

		return {
			userPercentile,
			subjectRankings,
			globalAverage,
			userAverage: Math.round(userAverage * 10) / 10,
		};
	},
});

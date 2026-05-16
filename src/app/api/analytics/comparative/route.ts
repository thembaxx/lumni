import { NextRequest, NextResponse } from "next/server";
import type { StudySession } from "@/lib/db/client";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "userId is required" },
				{ status: 400 },
			);
		}

		const allSessions = await listDocuments<StudySession>(
			COLLECTIONS.STUDY_SESSIONS,
		);

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

		const userTotal = userTotals[userId] || { answered: 0, correct: 0 };
		const userAverage =
			userTotal.answered > 0
				? (userTotal.correct / userTotal.answered) * 100
				: 0;

		const userAccuracy =
			userTotal.answered > 0 ? userTotal.correct / userTotal.answered : 0;
		const otherUsers = Object.entries(userTotals).filter(
			([id]) => id !== userId,
		);
		const usersBeaten = otherUsers.filter(
			([, data]) =>
				data.answered > 0 && data.correct / data.answered <= userAccuracy,
		).length;
		const userPercentile =
			otherUsers.length > 0
				? Math.round((usersBeaten / otherUsers.length) * 100)
				: 50;

		const userSessions = allSessions.filter((s) => s.userId === userId);
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

		return NextResponse.json({
			userPercentile,
			subjectRankings,
			globalAverage,
			userAverage: Math.round(userAverage * 10) / 10,
		});
	} catch {
		return NextResponse.json({
			userPercentile: 50,
			subjectRankings: {},
			globalAverage: 65,
			userAverage: 0,
		});
	}
}

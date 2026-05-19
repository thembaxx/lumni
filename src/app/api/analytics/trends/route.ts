import { Query } from "appwrite";
import { type NextRequest, NextResponse } from "next/server";
import type { StudySession } from "@/lib/db/client";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	try {
		const authenticatedUserId = await getAuthenticatedUserId();
		if (!authenticatedUserId) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const userId = searchParams.get("userId");
		const subject = searchParams.get("subject");

		if (!userId || !subject) {
			return NextResponse.json(
				{ error: "userId and subject are required" },
				{ status: 400 },
			);
		}

		if (userId !== authenticatedUserId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		const sessions = await listDocuments<StudySession>(
			COLLECTIONS.STUDY_SESSIONS,
			[Query.equal("userId", userId), Query.equal("subjectId", subject)],
		);

		if (sessions.length === 0) {
			return NextResponse.json({ dates: [], accuracies: [], trend: "stable" });
		}

		const monthlyGroups: Record<string, { answered: number; correct: number }> =
			{};
		for (const session of sessions) {
			const monthKey = session.startedAt?.slice(0, 7) || "unknown";
			if (!monthlyGroups[monthKey]) {
				monthlyGroups[monthKey] = { answered: 0, correct: 0 };
			}
			monthlyGroups[monthKey].answered += session.questionsAnswered;
			monthlyGroups[monthKey].correct += session.correctCount;
		}

		const sortedMonths = Object.keys(monthlyGroups).sort();
		const dates = sortedMonths.map((m) => {
			const [year, month] = m.split("-");
			const date = new Date(
				Number.parseInt(year, 10),
				Number.parseInt(month, 10) - 1,
			);
			return date.toLocaleDateString(undefined, {
				month: "short",
				year: "2-digit",
			});
		});
		const accuracies = sortedMonths.map((m) => {
			const g = monthlyGroups[m];
			return g.answered > 0 ? Math.round((g.correct / g.answered) * 100) : 0;
		});

		let trend: "improving" | "declining" | "stable" = "stable";
		if (accuracies.length >= 2) {
			const mid = Math.ceil(accuracies.length / 2);
			const firstAvg =
				accuracies.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
			const secondAvg =
				accuracies.slice(mid).reduce((a, b) => a + b, 0) /
				accuracies.slice(mid).length;
			if (secondAvg > firstAvg + 5) trend = "improving";
			else if (secondAvg < firstAvg - 5) trend = "declining";
		}

		return NextResponse.json({ dates, accuracies, trend });
	} catch (error) {
		console.error("[/api/analytics/trends] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get analytics trends" },
			{ status: 500 },
		);
	}
}

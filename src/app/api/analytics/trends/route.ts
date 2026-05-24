import { Query } from "appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import type { StudySession } from "@/lib/db/client";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "Analytics Trends",
	execute: async ({ userId, req }) => {
		const { searchParams } = new URL(req.url);
		const requestedUserId = searchParams.get("userId");
		const subject = searchParams.get("subject");

		if (!requestedUserId || !subject) {
			throw new HttpError(400, "userId and subject are required");
		}

		if (requestedUserId !== userId) {
			throw new HttpError(403, "Unauthorized");
		}

		const sessions = await listDocuments<StudySession>(
			COLLECTIONS.STUDY_SESSIONS,
			[
				Query.equal("userId", requestedUserId),
				Query.equal("subjectId", subject),
			],
		);

		if (sessions.length === 0) {
			return { dates: [], accuracies: [], trend: "stable" };
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

		return { dates, accuracies, trend };
	},
});

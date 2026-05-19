import { Query } from "appwrite";
import { NextResponse } from "next/server";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export async function GET() {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required", fallback: true },
				{ status: 401 },
			);
		}

		const progressDocs = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.USER_PROGRESS,
			[Query.orderDesc("questionsAttempted"), Query.limit(100)],
		);

		const entries = progressDocs.map((doc, index) => ({
			rank: index + 1,
			userId: doc.userId as string,
			displayName:
				(doc.displayName as string) || (doc.userId as string).slice(0, 8),
			xp: ((doc.questionsAttempted as number) || 0) * 10,
			streak: (doc.currentStreak as number) || 0,
			isCurrentUser: doc.userId === userId,
		}));

		return NextResponse.json({ entries });
	} catch (error) {
		console.error("Leaderboard error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch leaderboard", fallback: true },
			{ status: 500 },
		);
	}
}

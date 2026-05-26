import { Client, Databases, Query } from "appwrite";
import { NextResponse } from "next/server";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";

const COLLECTION = "user_gamification";

export async function GET() {
	try {
		const client = new Client()
			.setEndpoint(APPWRITE_ENDPOINT)
			.setProject(APPWRITE_PROJECT);
		const db = new Databases(client);

		try {
			const docs = await db.listDocuments(
				process.env.APPWRITE_DATABASE_ID!,
				COLLECTION,
				[Query.orderDesc("totalXp"), Query.limit(100)],
			);

			const entries = docs.documents.map((doc, index) => ({
				rank: index + 1,
				userId: doc.userId as string,
				label: (doc.label as string) || `Student ${index + 1}`,
				xp: (doc.totalXp as number) || 0,
				streak: (doc.currentStreak as number) || 0,
				level: (doc.level as number) || 1,
			}));

			return NextResponse.json({ entries });
		} catch (err) {
			console.error("Leaderboard fetch error:", err);
			return NextResponse.json({ entries: [] });
		}
	} catch (error) {
		console.error("Leaderboard GET error:", error);
		return NextResponse.json({ error: "Failed" }, { status: 500 });
	}
}

export const dynamic = "force-dynamic";

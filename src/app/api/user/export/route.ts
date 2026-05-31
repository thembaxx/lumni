import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { auth } from "@/lib/server/auth";

export async function GET() {
	try {
		const userId = await auth();

		const collections = [
			COLLECTIONS.USER_SUBJECTS,
			COLLECTIONS.USER_PROGRESS,
			COLLECTIONS.STUDY_SESSIONS,
			COLLECTIONS.COMPETENCIES,
			COLLECTIONS.EXAM_SESSIONS,
			COLLECTIONS.FLASHCARDS,
			COLLECTIONS.WRONG_ANSWERS,
			COLLECTIONS.CHAT_MESSAGES,
			COLLECTIONS.BOOKMARKS,
			COLLECTIONS.NOTES,
			COLLECTIONS.USER_GAMIFICATION,
			COLLECTIONS.USER_CONSENTS,
		];

		const data: Record<string, unknown[]> = {};

		for (const col of collections) {
			try {
				const docs = await listDocuments<Record<string, unknown>>(col, [
					Query.equal("userId", userId),
				]);
				data[col] = docs;
			} catch {
				data[col] = [];
			}
		}

		const exportData = {
			exportedAt: new Date().toISOString(),
			userId,
			collections: data,
		};

		return new NextResponse(JSON.stringify(exportData, null, 2), {
			headers: {
				"Content-Type": "application/json",
				"Content-Disposition": `attachment; filename="lumni-export-${new Date().toISOString().split("T")[0]}.json"`,
			},
		});
	} catch (error) {
		console.error("[user/export] Failed:", error);
		return NextResponse.json(
			{ error: "Failed to export data" },
			{ status: 500 },
		);
	}
}

import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { auth } from "@/lib/server/auth";

const EXPORT_COLLECTIONS = [
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

export async function GET() {
	try {
		const userId = await auth();

		const entries = await Promise.all(
			EXPORT_COLLECTIONS.map(async (col) => {
				try {
					const docs = await listDocuments<Record<string, unknown>>(col, [
						Query.equal("userId", userId),
					]);
					return [col, docs] as const;
				} catch {
					return [col, []] as const;
				}
			}),
		);

		const exportData = {
			exportedAt: new Date().toISOString(),
			userId,
			collections: Object.fromEntries(entries),
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

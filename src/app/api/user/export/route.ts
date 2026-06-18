import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { auth } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";

const INTERNAL_KEYS = new Set(["$id", "$collectionId", "$permissions"]);

function stripInternals(doc: Record<string, unknown>): Record<string, unknown> {
	const clean: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(doc)) {
		if (!INTERNAL_KEYS.has(k)) clean[k] = v;
	}
	return clean;
}

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
					return [col, docs.map(stripInternals)] as const;
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
		logError("UserExport", error);
		return NextResponse.json(
			{ error: "Failed to export data" },
			{ status: 500 },
		);
	}
}

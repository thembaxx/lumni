import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
	try {
		const response = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
		);

		const sessions = response.documents.map((doc) => ({
			id: doc.$id,
			examPaperId: doc.examPaperId,
			answers: doc.answers ? JSON.parse(doc.answers as string) : {},
			flags: doc.flags ? JSON.parse(doc.flags as string) : [],
			timeRemaining: doc.timeRemaining,
			completed: doc.completed,
			startedAt: doc.startedAt,
			lastSavedAt: doc.lastSavedAt,
		}));

		return NextResponse.json({ sessions });
	} catch (error) {
		console.error("Failed to list sessions:", error);
		return NextResponse.json({ sessions: [] }, { status: 200 });
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { paperId, answers, flags, timeRemaining, startedAt } = body;

		const docId = await databases.createDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			"unique()",
			{
				examPaperId: paperId,
				answers: JSON.stringify(answers || {}),
				flags: JSON.stringify(flags || []),
				timeRemaining: timeRemaining || 0,
				completed: timeRemaining <= 0,
				startedAt: startedAt || new Date().toISOString(),
				lastSavedAt: new Date().toISOString(),
			},
		);

		return NextResponse.json({ success: true, id: docId });
	} catch (error) {
		console.error("Failed to save session:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to save session",
			},
			{ status: 500 },
		);
	}
}

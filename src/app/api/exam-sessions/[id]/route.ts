import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const doc = await databases.getDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_SESSIONS,
			id,
		);

		if (!doc) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		return NextResponse.json({
			id: doc.$id,
			examPaperId: doc.examPaperId,
			answers: doc.answers ? JSON.parse(doc.answers as string) : {},
			flags: doc.flags ? JSON.parse(doc.flags as string) : [],
			timeRemaining: doc.timeRemaining,
			completed: doc.completed,
			startedAt: doc.startedAt,
			lastSavedAt: doc.lastSavedAt,
		});
	} catch (error) {
		console.error("Failed to get session:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to get session",
			},
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		await databases.deleteDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_SESSIONS,
			id,
		);
		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to delete session",
			},
			{ status: 500 },
		);
	}
}

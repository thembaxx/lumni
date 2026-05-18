import { NextRequest, NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { subject, questionsAnswered, correctCount, duration } = body;

		if (!subject) {
			return NextResponse.json(
				{ error: "subject is required" },
				{ status: 400 },
			);
		}

		const now = new Date().toISOString();

		await databases.createDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.STUDY_SESSIONS,
			"unique()",
			{
				userId: "anonymous",
				subjectId: subject,
				questionsAnswered: questionsAnswered ?? 0,
				correctCount: correctCount ?? 0,
				duration: duration ?? 0,
				startedAt: now,
				endedAt: now,
			},
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to create study session:", error);
		return NextResponse.json(
			{ success: false, error: String(error) },
			{ status: 500 },
		);
	}
}

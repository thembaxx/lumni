import { NextResponse } from "next/server";
import { COLLECTIONS, createDocument } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export async function POST(request: Request) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const { topics } = (await request.json()) as { topics?: string[] };
	if (!topics || topics.length === 0) {
		return NextResponse.json({ error: "topics required" }, { status: 400 });
	}

	try {
		await createDocument(COLLECTIONS.TEACHER_ASSIGNMENTS, {
			teacherId: userId,
			topicIds: JSON.stringify(topics),
			status: "pending",
			createdAt: new Date().toISOString(),
		});
		return NextResponse.json({ success: true, topics });
	} catch (error) {
		console.error("[teacher/assign] Failed:", error);
		return NextResponse.json(
			{ error: "Failed to create assignment" },
			{ status: 500 },
		);
	}
}

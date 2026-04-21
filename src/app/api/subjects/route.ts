import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import {
	studySession,
	subject,
	userProgress,
	userSubject,
} from "@/lib/db/schema";

export async function GET(request: NextRequest) {
	const db = getDb();
	const subjects = await db.select().from(subject);

	const { searchParams } = new URL(request.url);
	const requestedUserId = searchParams.get("userId");

	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		return NextResponse.json(
			{ subjects },
			{ status: 200 },
		);
	}

	const authenticatedUserId = session.user.id;

	const targetUserId = requestedUserId ?? authenticatedUserId;

	if (targetUserId !== authenticatedUserId) {
		return NextResponse.json(
			{ error: "Unauthorized: Cannot access another user's data" },
			{ status: 403 },
		);
	}

	const selectedUserSubjects = await db
		.select()
		.from(userSubject)
		.where(eq(userSubject.userId, targetUserId));

	const selectedIds = selectedUserSubjects.map((us) => us.subjectId);

	const progressArr = await db
		.select()
		.from(userProgress)
		.where(eq(userProgress.userId, targetUserId))
		.limit(1);

	const progress = progressArr[0] || null;

	const sessions = await db
		.select()
		.from(studySession)
		.where(eq(studySession.userId, targetUserId));

	const totalAnswered = sessions.reduce(
		(sum, s) => sum + (s.questionsAnswered || 0),
		0,
	);
	const totalCorrect = sessions.reduce(
		(sum, s) => sum + (s.correctCount || 0),
		0,
	);
	const accuracy =
		totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

	return NextResponse.json({
		subjects,
		selectedSubjectIds: selectedIds,
		progress: {
			questionsAnswered: totalAnswered,
			accuracy,
			streak: progress?.currentStreak ?? 0,
		},
	});
}

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
	studySession,
	subject,
	userProgress,
	userSubject,
} from "@/lib/db/schema";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const userId = searchParams.get("userId");

	const db = getDb();
	const subjects = await db.select().from(subject);

	if (!userId) {
		return NextResponse.json({ subjects });
	}

	const selectedUserSubjects = await db
		.select()
		.from(userSubject)
		.where(eq(userSubject.userId, userId));

	const selectedIds = selectedUserSubjects.map((us) => us.subjectId);

	const progressArr = await db
		.select()
		.from(userProgress)
		.where(eq(userProgress.userId, userId))
		.limit(1);

	const progress = progressArr[0] || null;

	const sessions = await db
		.select()
		.from(studySession)
		.where(eq(studySession.userId, userId));

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

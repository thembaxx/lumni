import { Query } from "appwrite";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function subjectsHandler(request: NextRequest) {
	let allSubjects: unknown[] = [];
	try {
		allSubjects = await listDocuments(COLLECTIONS.SUBJECTS);
	} catch (dbError: unknown) {
		const err = dbError as Error;
		console.error("Database error:", err.message);
		return NextResponse.json(
			{ subjects: [], error: "Database unavailable" },
			{ status: 503 },
		);
	}

	const { searchParams } = new URL(request.url);
	const requestedUserId = searchParams.get("userId");

	const authenticatedUserId = await getAuthenticatedUserId();

	if (!authenticatedUserId) {
		return NextResponse.json({ subjects: allSubjects }, { status: 200 });
	}

	const targetUserId = requestedUserId ?? authenticatedUserId;

	if (targetUserId !== authenticatedUserId) {
		return NextResponse.json(
			{ error: "Unauthorized: Cannot access another user's data" },
			{ status: 403 },
		);
	}

	const selectedUserSubjects = await listDocuments(COLLECTIONS.USER_SUBJECTS, [
		Query.equal("userId", targetUserId),
	]);

	const selectedIds = selectedUserSubjects.map(
		(us) => (us as Record<string, unknown>).subjectId as string,
	);

	const progressArr = await listDocuments(COLLECTIONS.USER_PROGRESS, [
		Query.equal("userId", targetUserId),
		Query.limit(1),
	]);

	const progress = progressArr[0] || null;

	const sessions = await listDocuments(COLLECTIONS.STUDY_SESSIONS, [
		Query.equal("userId", targetUserId),
	]);

	const totalAnswered = sessions.reduce(
		(sum: number, s) =>
			sum + ((s as Record<string, unknown>).questionsAnswered as number) || 0,
		0,
	);
	const totalCorrect = sessions.reduce(
		(sum: number, s) =>
			sum + ((s as Record<string, unknown>).correctCount as number) || 0,
		0,
	);
	const accuracy =
		totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

	return NextResponse.json({
		subjects: allSubjects,
		selectedSubjectIds: selectedIds,
		progress: {
			questionsAnswered: totalAnswered,
			accuracy,
			streak: progress
				? ((progress as Record<string, unknown>).currentStreak as number)
				: 0,
		},
	});
}

export const GET = withRateLimit(subjectsHandler, {
	max: 30,
	windowMs: 60000,
});

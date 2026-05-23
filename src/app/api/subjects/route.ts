import { Query } from "appwrite";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type {
	StudySession,
	Subject,
	UserProgress,
	UserSubject,
} from "@/lib/db/client";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

function mapSubject(s: Subject) {
	return { ...s, id: s.code || s.$id };
}

async function subjectsHandler(request: NextRequest) {
	let subjects: Subject[] = [];
	try {
		subjects = await listDocuments<Subject>(COLLECTIONS.SUBJECTS);
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
		return NextResponse.json(
			{ subjects: subjects.map(mapSubject) },
			{ status: 200 },
		);
	}

	const targetUserId = requestedUserId ?? authenticatedUserId;

	if (targetUserId !== authenticatedUserId) {
		return NextResponse.json(
			{ error: "Unauthorized: Cannot access another user's data" },
			{ status: 403 },
		);
	}

	const [selectedUserSubjects, progressArr, sessions] = await Promise.all([
		listDocuments<UserSubject>(COLLECTIONS.USER_SUBJECTS, [
			Query.equal("userId", targetUserId),
		]),
		listDocuments<UserProgress>(COLLECTIONS.USER_PROGRESS, [
			Query.equal("userId", targetUserId),
			Query.limit(1),
		]),
		listDocuments<StudySession>(COLLECTIONS.STUDY_SESSIONS, [
			Query.equal("userId", targetUserId),
		]),
	]);

	const selectedIds = selectedUserSubjects.map((us) => us.subjectId);

	const progress = progressArr[0] || null;

	const totalAnswered = sessions.reduce(
		(sum: number, s) => sum + (s.questionsAnswered || 0),
		0,
	);
	const totalCorrect = sessions.reduce(
		(sum: number, s) => sum + (s.correctCount || 0),
		0,
	);
	const accuracy =
		totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

	return NextResponse.json({
		subjects: subjects.map(mapSubject),
		selectedSubjectIds: selectedIds,
		progress: {
			questionsAnswered: totalAnswered,
			accuracy,
			streak: progress ? progress.currentStreak : 0,
		},
	});
}

export const GET = withRateLimit(subjectsHandler, {
	max: 30,
	windowMs: 60000,
});

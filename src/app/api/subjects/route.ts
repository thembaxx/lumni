import { Query } from "appwrite";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { account } from "@/lib/appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export async function GET(request: NextRequest) {
	let allSubjects;
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

	let sessionUser;
	try {
		sessionUser = await account.get();
	} catch {
		return NextResponse.json({ subjects: allSubjects }, { status: 200 });
	}

	if (!sessionUser) {
		return NextResponse.json({ subjects: allSubjects }, { status: 200 });
	}

	const authenticatedUserId = sessionUser.$id;
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

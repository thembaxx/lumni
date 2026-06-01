import { Query } from "appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import type {
	StudySession,
	Subject,
	UserProgress,
	UserSubject,
} from "@/lib/db/client";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

function mapSubject(s: Subject) {
	return { ...s, id: s.code || s.$id };
}

export const GET = withRateLimit(
	createRouteHandler({
		auth: "optional",
		execute: async ({ userId, req }) => {
			let subjects: Subject[] = [];
			try {
				subjects = await listDocuments<Subject>(COLLECTIONS.SUBJECTS);
			} catch (dbError: unknown) {
				const msg =
					dbError instanceof Error ? dbError.message : "Unknown database error";
				console.error("Database error:", msg);
				throw new HttpError(503, "Database unavailable");
			}

			const { searchParams } = new URL(req.url);
			const requestedUserId = searchParams.get("userId");

			if (!userId) {
				return { subjects: subjects.map(mapSubject) };
			}

			const targetUserId = requestedUserId ?? userId;

			if (targetUserId !== userId) {
				throw new HttpError(
					403,
					"Unauthorized: Cannot access another user's data",
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
				totalAnswered > 0
					? Math.round((totalCorrect / totalAnswered) * 100)
					: 0;

			return {
				subjects: subjects.map(mapSubject),
				selectedSubjectIds: selectedIds,
				progress: {
					questionsAnswered: totalAnswered,
					accuracy,
					streak: progress ? progress.currentStreak : 0,
				},
			};
		},
		errorLabel: "Subjects",
	}),
	{ max: 30, windowMs: 60000 },
);

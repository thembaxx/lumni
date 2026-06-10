import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite.server";
import { dexieDataAccess } from "@/lib/db";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ token: string }> },
) {
	const { token } = await params;

	let link: {
		token: string;
		teacherId: string;
		createdAt: number;
		expiresAt: number;
		revoked: boolean;
	} | null = null;

	try {
		const docs = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.GHOST_LINKS,
			[],
		);
		const found = docs.documents.find(
			(d: Record<string, unknown>) => d.token === token,
		);
		if (found) {
			link = found as unknown as {
				token: string;
				teacherId: string;
				createdAt: number;
				expiresAt: number;
				revoked: boolean;
			};
		}
	} catch (e) {
		logError("GhostTokenFetch", e);
	}

	if (!link) {
		return NextResponse.json(
			{ error: "Invalid or expired token" },
			{ status: 404 },
		);
	}
	if (link.revoked || link.expiresAt < Date.now()) {
		return NextResponse.json(
			{ error: "Token expired or revoked" },
			{ status: 403 },
		);
	}

	try {
		const [_competencies, quizAttempts, subjects] = await Promise.all([
			dexieDataAccess.competencies.toArray(),
			dexieDataAccess.quizAttempts.toArray(),
			dexieDataAccess.subjects.toArray(),
		]);

		const subjectEnrollments: Record<string, number> = {};
		for (const sub of subjects) {
			subjectEnrollments[sub.code] = (subjectEnrollments[sub.code] || 0) + 1;
		}

		const subjectScores: Record<string, number[]> = {};
		for (const attempt of quizAttempts) {
			const score =
				attempt.totalQuestions > 0
					? (attempt.score / attempt.totalQuestions) * 100
					: 0;
			const key = attempt.odSubject;
			if (!subjectScores[key]) subjectScores[key] = [];
			subjectScores[key].push(score);
		}

		const avgScores: Record<string, number> = {};
		for (const [subject, scores] of Object.entries(subjectScores)) {
			avgScores[subject] = Math.round(
				scores.reduce((a, b) => a + b, 0) / scores.length,
			);
		}

		const totalAttempts = quizAttempts.length;
		const completedAttempts = quizAttempts.filter((a) => a.score > 0).length;

		return NextResponse.json({
			totalStudents: subjects.length,
			subjectEnrollments,
			avgScores,
			totalQuizAttempts: totalAttempts,
			completionRate:
				totalAttempts > 0
					? Math.round((completedAttempts / totalAttempts) * 100)
					: 0,
			lastUpdated: Date.now(),
		});
	} catch {
		return NextResponse.json(
			{ error: "Failed to aggregate stats" },
			{ status: 500 },
		);
	}
}

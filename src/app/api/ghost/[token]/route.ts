import { NextResponse } from "next/server";
import { offlineDB } from "@/lib/db/schema";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ token: string }> },
) {
	const { token } = await params;
	const raw = localStorage.getItem(`lumni_ghost_${token}`);
	if (!raw)
		return NextResponse.json(
			{ error: "Invalid or expired token" },
			{ status: 404 },
		);

	const link = JSON.parse(raw) as {
		token: string;
		teacherId: string;
		createdAt: number;
		expiresAt: number;
		revoked: boolean;
	};
	if (link.revoked || link.expiresAt < Date.now()) {
		return NextResponse.json(
			{ error: "Token expired or revoked" },
			{ status: 403 },
		);
	}

	try {
		const [_competencies, quizAttempts, subjects] = await Promise.all([
			offlineDB.competencies.toArray(),
			offlineDB.quizAttempts.toArray(),
			offlineDB.subjects.toArray(),
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

import { Query } from "appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import { enqueueGradeSideEffects } from "@/lib/orchestrator/grading";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";

async function sendAssignmentGradedPush(
	userId: string,
	subject: string,
	score: number,
	total: number,
): Promise<void> {
	try {
		const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
		const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
		if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

		const [webpushModule, { Query: AQuery }, { listDocuments: listDocs }] =
			await Promise.all([
				import("web-push"),
				import("appwrite"),
				import("@/lib/db/client"),
			]);

		webpushModule.default.setVapidDetails(
			"mailto:study@lumni.app",
			VAPID_PUBLIC_KEY,
			VAPID_PRIVATE_KEY,
		);

		const subscriptions = await listDocs<Record<string, unknown>>(
			"push_subscriptions",
			[AQuery.equal("userId", userId)],
		);

		await Promise.allSettled(
			subscriptions.map((sub) => {
				const pushSub = {
					endpoint: sub.endpoint as string,
					keys: {
						auth: sub.auth as string,
						p256dh: sub.p256dh as string,
					},
				};
				return webpushModule.default.sendNotification(
					pushSub,
					JSON.stringify({
						title: "Assignment Graded",
						body: `Your ${subject} assignment received a score of ${score}/${total}`,
						url: "/dashboard",
					}),
				);
			}),
		);
	} catch {
		// Push notification delivery is best-effort
	}
}

interface AnswerEntry {
	question: Question;
	answer: UserAnswer;
}

interface GradedAnswer {
	questionId: string;
	questionText: string;
	correct: boolean;
	score: number;
	maxScore: number;
	feedback: string;
}

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "StudentAssignmentSubmit",
	validate: (body: Record<string, unknown>) => {
		if (!body.answers || typeof body.answers !== "object")
			return "answers object is required";
		if (!body.subject || typeof body.subject !== "string")
			return "subject is required";
		return null;
	},
	execute: async ({ userId, body, params }) => {
		const assignmentId = params?.id as string;
		const { answers, subject, topic } = body as {
			answers: Record<string, unknown>;
			subject: string;
			topic?: string;
		};

		const assignment = await listDocuments(COLLECTIONS.TEACHER_ASSIGNMENTS, [
			Query.equal("$id", assignmentId),
			Query.limit(1),
		]);
		if (assignment.length === 0) {
			throw new HttpError(404, "Assignment not found");
		}

		const engine = await QuestionEngine.initialize();

		const gradedAnswers: GradedAnswer[] = [];
		let totalScore = 0;
		let totalMaxScore = 0;

		for (const [questionId, raw] of Object.entries(answers)) {
			const entry = raw as AnswerEntry;
			const question = entry.question;
			const userAnswer = entry.answer;

			if (!question || !userAnswer) {
				logError("StudentAssignmentSubmit", {
					message: "Skipping invalid answer entry",
					questionId,
				});
				continue;
			}

			try {
				const result = await engine.grade(question, userAnswer);
				gradedAnswers.push({
					questionId,
					questionText: question.questionText,
					correct: result.correct,
					score: result.score,
					maxScore: result.maxScore,
					feedback: result.feedback,
				});
				totalScore += result.score;
				totalMaxScore += result.maxScore;

				const bloomLevel = question.bloomTaxonomy ?? "understand";
				await enqueueGradeSideEffects({
					subject,
					topic: topic ?? "assignment",
					bloomLevel,
					questionType: question.type,
					score: result.score,
					maxScore: result.maxScore,
					correct: result.correct,
					question,
				});
			} catch (err) {
				logError("StudentAssignmentSubmit", {
					message: "Failed to grade question",
					questionId,
					error: err instanceof Error ? err.message : String(err),
				});
				gradedAnswers.push({
					questionId,
					questionText: question.questionText,
					correct: false,
					score: 0,
					maxScore: question.points,
					feedback: "Grading failed",
				});
				totalMaxScore += question.points;
			}
		}

		const correctCount = gradedAnswers.filter((g) => g.correct).length;

		const existing = await listDocuments(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, [
			Query.equal("assignmentId", assignmentId),
			Query.equal("studentId", userId as string),
		]);

		if (existing.length > 0) {
			await updateDocument(
				COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
				(existing[0] as Record<string, unknown>).$id as string,
				{
					score: totalScore,
					maxScore: totalMaxScore,
					totalQuestions: gradedAnswers.length,
					correctCount,
					completedAt: new Date().toISOString(),
					gradedAnswers: JSON.stringify(gradedAnswers),
				},
			);
		} else {
			await createDocument(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, {
				assignmentId,
				studentId: userId,
				score: totalScore,
				maxScore: totalMaxScore,
				totalQuestions: gradedAnswers.length,
				correctCount,
				completedAt: new Date().toISOString(),
				gradedAnswers: JSON.stringify(gradedAnswers),
			});
		}

		await sendAssignmentGradedPush(
			userId as string,
			subject,
			totalScore,
			totalMaxScore,
		);

		return {
			success: true,
			score: totalScore,
			total: totalMaxScore,
			correctCount,
			gradedAnswers,
		};
	},
});

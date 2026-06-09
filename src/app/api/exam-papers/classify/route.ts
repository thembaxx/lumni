import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import { classifyQuestions } from "@/lib/exam-paper-ingestion/question-classifier";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const POST = withRateLimit(
	createRouteHandler({
		auth: "required",
		errorLabel: "QuestionClassifier",
		parseBody: async (req) => {
			const body = await req.json();
			const subject = body?.subject as string | undefined;
			if (!subject) throw new Error("subject is required");
			return { subject };
		},
		validate: ({ subject }: { subject: string }) => {
			if (!subject) return "subject is required";
			return null;
		},
		execute: async ({ body }) => {
			const { subject } = body;

			const docs = await databases.listDocuments(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.PAST_PAPER_QUESTIONS,
				[Query.equal("subject", subject), Query.limit(5000)],
			);

			const appwriteIdByQuestionId = new Map<string, string>();
			const unclassified: PastPaperQuestion[] = [];

			for (const d of docs.documents) {
				const q = d as unknown as PastPaperQuestion & { $id: string };
				if (!q.subtopicId) {
					appwriteIdByQuestionId.set(q.id, q.$id);
					unclassified.push({
						id: q.id,
						subject: q.subject,
						topic: q.topic,
						subtopicId: q.subtopicId,
						year: q.year,
						paperNumber: q.paperNumber,
						sectionTitle: q.sectionTitle,
						questionId: q.questionId,
						partId: q.partId,
						questionText: q.questionText,
						answerText: q.answerText,
						marks: q.marks,
						questionType: q.questionType,
						bloomLevel: q.bloomLevel,
						createdAt: q.createdAt,
					});
				}
			}

			if (unclassified.length === 0) {
				return {
					total: 0,
					classified: 0,
					failed: 0,
					message: "All questions already classified",
				};
			}

			const results = await classifyQuestions(unclassified, subject);
			let updated = 0;
			let failed = 0;

			for (const r of results) {
				if (!r.subtopicId) {
					failed++;
					continue;
				}
				const appwriteId = appwriteIdByQuestionId.get(r.id);
				if (!appwriteId) {
					failed++;
					continue;
				}
				try {
					await databases.updateDocument(
						APPWRITE_DATABASE_ID,
						COLLECTIONS.PAST_PAPER_QUESTIONS,
						appwriteId,
						{ subtopicId: r.subtopicId },
					);
					updated++;
				} catch {
					failed++;
				}
			}

			return {
				total: unclassified.length,
				classified: updated,
				failed,
			};
		},
	}),
	{ max: 3, windowMs: 120000 },
);

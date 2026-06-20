import { type NextRequest, NextResponse } from "next/server";
import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { classifyQuestions } from "@/lib/exam-paper-ingestion/question-classifier";
import { requireAdmin } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

function createClassifyHandler(db: DataAccess = dexieDataAccess) {
	return withRateLimit(
		async (req: NextRequest) => {
			try {
				await requireAdmin();
			} catch (err) {
				const msg =
					err instanceof Error ? err.message : "Admin access required";
				if (msg.includes("Authentication required")) {
					return NextResponse.json({ error: msg }, { status: 401 });
				}
				return NextResponse.json({ error: msg }, { status: 403 });
			}

			let body: { subject?: string };
			try {
				body = await req.json();
			} catch {
				return NextResponse.json(
					{ error: "Invalid JSON in request body" },
					{ status: 400 },
				);
			}

			const subject = body?.subject;
			if (!subject) {
				return NextResponse.json(
					{ error: "subject is required" },
					{ status: 400 },
				);
			}

			const pastPaperQuestions = db.pastPaperQuestions;
			const all = await pastPaperQuestions
				.where("subject")
				.equals(subject)
				.toArray();

			const unclassified = all
				.filter((q) => !q.subtopicId)
				.map((q) => ({
					id: q.id,
					questionText: q.questionText,
					subject: q.subject,
				}));

			if (unclassified.length === 0) {
				return NextResponse.json({
					total: 0,
					classified: 0,
					message: "All questions already classified",
				});
			}

			const curriculumTopics = all
				.filter((q) => q.topic)
				.map((q) => {
					const topic = q.topic ?? "";
					return { id: topic, subject: q.subject, topic, subtopic: topic };
				});

			const classifications = await classifyQuestions(
				unclassified,
				curriculumTopics,
			);

			for (const [questionId, subtopicId] of classifications) {
				const question = all.find((q) => q.id === questionId);
				if (question) {
					await pastPaperQuestions.update(questionId, { subtopicId });
				}
			}

			return NextResponse.json({
				total: unclassified.length,
				classified: classifications.size,
			});
		},
		{ max: 3, windowMs: 120000 },
	);
}

export const POST = createClassifyHandler();

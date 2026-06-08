import { createRouteHandler } from "@/lib/api/create-route-handler";
import { shareQuestion } from "@/lib/share/share-service";
import { getSourceForQuestion } from "@/lib/tinyfish";
import type { Question } from "@/lib/question-engine/types";

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "ShareQuestion",
	validate: (body) => {
		if (!body.question || !body.subject) return "question and subject required";
		return null;
	},
	execute: async ({ userId, body }) => {
		const { question, subject, topic } = body as {
			question: unknown;
			subject: string;
			topic?: string;
		};

		let sources: { url: string; title: string }[] | undefined;
		try {
			const questionObj = question as { questionText?: string };
			const questionText = questionObj?.questionText ?? "";
			if (questionText.trim()) {
				const ragContext = await getSourceForQuestion({
					question: questionText,
					userId: userId as string,
				});
				sources =
					ragContext?.sources?.map((s) => ({
						url: s.url,
						title: s.title,
					})) ?? [];
			}
		} catch {
			/* RAG failure should not break sharing */
		}

		const id = await shareQuestion(
			question as Question,
			subject.toLowerCase(),
			topic ?? "general",
			userId as string,
			sources,
		);

		return {
			success: true,
			id,
			url: `${process.env.NEXT_PUBLIC_APP_URL || "https://lumni-psi.vercel.app"}/q/${id}`,
		};
	},
});

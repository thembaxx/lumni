import { createRouteHandler } from "@/lib/api/create-route-handler";
import { shareQuestion } from "@/lib/share/share-service";

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

		const id = await shareQuestion(
			question as never,
			subject.toLowerCase(),
			topic ?? "general",
			userId as string,
		);

		return {
			success: true,
			id,
			url: `${process.env.NEXT_PUBLIC_APP_URL || "https://lumni-psi.vercel.app"}/q/${id}`,
		};
	},
});

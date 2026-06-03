import { createRouteHandler } from "@/lib/api/create-route-handler";
import {
	getSharedQuestion,
	incrementViewCount,
} from "@/lib/share/share-service";

export const GET = createRouteHandler({
	auth: "optional",
	errorLabel: "GetSharedQuestion",
	execute: async ({ params }) => {
		const id = params?.id as string;

		if (!id || id.length < 4) {
			return { error: "Invalid question ID" };
		}

		const record = await getSharedQuestion(id);

		if (!record) {
			return { error: "Question not found" };
		}

		incrementViewCount(id).catch(() => {});

		return {
			id: record.id,
			question: record.question,
			subject: record.subject,
			topic: record.topic,
			sharedAt: record.sharedAt,
		};
	},
});

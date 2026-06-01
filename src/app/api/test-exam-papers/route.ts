import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export const GET = createRouteHandler({
	auth: "none",
	errorLabel: "TestExamPapers",
	execute: async () => {
		const papers = await listDocuments(COLLECTIONS.EXAM_PAPERS);
		return {
			papers: papers.slice(0, 5),
			count: papers.length,
		};
	},
});

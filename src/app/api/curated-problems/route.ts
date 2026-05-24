import { createAIHandler } from "@/lib/api/create-ai-handler";
import { curatedProblemsService } from "@/lib/services/curated-problems";

export const dynamic = "force-dynamic";

interface CuratedBody {
	subject: string;
	topic?: string;
	count?: number;
}

export const POST = createAIHandler<CuratedBody>({
	budgetType: "generate",
	errorLabel: "CuratedProblems",
	parseBody: async (req) => {
		const body: CuratedBody = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.subject) return "Subject is required";
		return null;
	},
	service: curatedProblemsService,
});

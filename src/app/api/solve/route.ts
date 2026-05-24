import { createAIHandler } from "@/lib/api/create-ai-handler";
import { aiSolver } from "@/lib/services/ai-solver";

export const dynamic = "force-dynamic";

interface SolveBody {
	question?: string;
	imageUrl?: string;
	mode?: string;
	subject?: string;
	context?: { role: string; content: string }[];
	followUp?: boolean;
}

export const POST = createAIHandler<SolveBody>({
	budgetType: "generate",
	errorLabel: "Solve",
	parseBody: async (req) => {
		const body: SolveBody = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.question && !body.imageUrl) {
			return "Either question text or image is required";
		}
		return null;
	},
	service: aiSolver,
});

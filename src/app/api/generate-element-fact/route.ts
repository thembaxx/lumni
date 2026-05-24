import { createAIHandler } from "@/lib/api/create-ai-handler";
import { elementFactService } from "@/lib/services/element-fact";

export const dynamic = "force-dynamic";

interface GenerateFactBody {
	element: {
		atomicNumber: number;
		name: string;
		symbol: string;
	};
}

export const POST = createAIHandler<GenerateFactBody>({
	budgetType: "generate",
	errorLabel: "ElementFact",
	parseBody: async (req) => {
		const body: GenerateFactBody = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.element?.name || !body.element.symbol) {
			return "Invalid element data";
		}
		return null;
	},
	service: elementFactService,
});

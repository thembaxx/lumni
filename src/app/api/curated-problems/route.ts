import { createRouteHandler } from "@/lib/api/create-route-handler";
import { curatedProblemsService } from "@/lib/services/curated-problems";

export const dynamic = "force-dynamic";

interface CuratedBody {
	subject: string;
	topic?: string;
	count?: number;
}

export const POST = createRouteHandler<CuratedBody>({
	auth: "none",
	budget: "generate",
	errorLabel: "CuratedProblems",
	useRateLimit: true,
	aiContext: { consentGranted: true },
	parseBody: async (req) => {
		const body: CuratedBody = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.subject) return "Subject is required";
		return null;
	},
	execute: async ({ body }) => curatedProblemsService.execute(body),
});

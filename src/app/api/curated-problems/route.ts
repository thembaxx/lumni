import { createRouteHandler } from "@/lib/api/create-route-handler";
import { curatedProblemsService } from "@/lib/services/curated-problems";

interface CuratedBody {
  subject: string;
  topic?: string;
  count?: number;
}

export const POST = createRouteHandler<CuratedBody>({
  auth: "required",
  budget: "generate",
  errorLabel: "CuratedProblems",
  useRateLimit: true,

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

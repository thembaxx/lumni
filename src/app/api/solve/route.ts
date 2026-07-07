import { createRouteHandler } from "@/lib/api/create-route-handler";
import { aiSolver } from "@/lib/services/ai-solver";

interface SolveBody {
  question?: string;
  imageUrl?: string;
  mode?: string;
  subject?: string;
  context?: { role: string; content: string }[];
  followUp?: boolean;
}

export const POST = createRouteHandler<SolveBody>({
  auth: "required",
  budget: "generate",
  errorLabel: "Solve",
  useRateLimit: true,

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
  execute: async ({ body, userId }) =>
    aiSolver.execute(body, userId) as Promise<Record<string, unknown>>,
});

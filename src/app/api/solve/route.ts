import { getAI } from "@/lib/ai";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { SolvePipeline, type SolveBody } from "@/lib/services/solve-pipeline";
import { buildPromptInstruction, getSourceForQuestion } from "@/lib/tinyfish";

let pipeline: SolvePipeline | null = null;

function getPipeline(): SolvePipeline {
  if (!pipeline) {
    pipeline = new SolvePipeline({
      ai: getAI(),
      getSourceForQuestion,
      buildPromptInstruction,
    });
  }
  return pipeline;
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
  execute: async ({ body, userId }) => {
    const result = await getPipeline().execute(body, userId);
    return result as unknown as Record<string, unknown>;
  },
});

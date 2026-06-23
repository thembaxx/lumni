import { createRouteHandler } from "@/lib/api/create-route-handler";
import { elementFactService } from "@/lib/services/element-fact";

interface GenerateFactBody {
  element: {
    atomicNumber: number;
    name: string;
    symbol: string;
  };
}

export const POST = createRouteHandler<GenerateFactBody>({
  auth: "none",
  budget: "generate",
  errorLabel: "ElementFact",
  useRateLimit: true,
  aiContext: { consentGranted: true },
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
  execute: async ({ body }) => elementFactService.execute(body),
});

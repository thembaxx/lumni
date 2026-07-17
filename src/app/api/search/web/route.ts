import { createRouteHandler } from "@/lib/api/create-route-handler";
import { searchWebExa } from "@/lib/services";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "WebSearch",
  useRateLimit: true,
  validate: (body) => {
    if (!body.query || typeof body.query !== "string" || body.query.trim().length < 2) {
      return "Query must be at least 2 characters";
    }
    return null;
  },
  execute: async ({ body }) => {
    const { query, numResults } = body as {
      query?: string;
      numResults?: number;
    };
    const results = await searchWebExa(query ?? "", { numResults });
    return { results };
  },
});

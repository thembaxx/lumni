import { createRouteHandler } from "@/lib/api/create-route-handler";
import { searchWeb } from "@/lib/services/web-search-service";

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "WebSearch",
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
    const results = await searchWeb(query ?? "", { numResults });
    return { results };
  },
});

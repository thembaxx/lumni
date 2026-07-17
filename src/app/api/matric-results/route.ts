import { createRouteHandler } from "@/lib/api/create-route-handler";
import { getMatricResultsByCandidate } from "@/lib/matric-results";

export const GET = createRouteHandler({
  auth: "none",
  useRateLimit: true,
  errorLabel: "MatricResults",
  execute: async ({ req }) => {
    const { searchParams } = new URL(req.url);
    const candidateNumber = searchParams.get("candidateNumber") || "";

    if (!candidateNumber.trim()) {
      return { results: [], total: 0 };
    }

    const results = getMatricResultsByCandidate(candidateNumber.trim());

    return {
      results,
      total: results.length,
    };
  },
});

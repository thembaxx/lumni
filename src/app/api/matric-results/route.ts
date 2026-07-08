import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { matricResultsYears, searchMatricResults } from "@/lib/matric-results";

export const GET = createRouteHandler({
  auth: "none",
  useRateLimit: true,
  errorLabel: "MatricResults",
  execute: async ({ req }) => {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || "";
    const yearParam = searchParams.get("year");

    const year = yearParam ? Number.parseInt(yearParam, 10) : matricResultsYears[0];

    if (!matricResultsYears.includes(year as (typeof matricResultsYears)[number])) {
      throw new HttpError(400, `Invalid year. Supported: ${matricResultsYears.join(", ")}`);
    }

    const results = searchMatricResults(name, year);

    return {
      results,
      year,
      total: results.length,
      isDemoData: true,
      disclaimer: "Demo data — not real matric results. Official DBE results pending integration.",
    };
  },
});

import { type NextRequest, NextResponse } from "next/server";
import { matricResultsYears, searchMatricResults } from "@/lib/matric-results";
import { logError } from "@/lib/shared/logger";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const name = searchParams.get("name") || "";
		const yearParam = searchParams.get("year");

		const year = yearParam
			? Number.parseInt(yearParam, 10)
			: matricResultsYears[0];

		if (
			!matricResultsYears.includes(year as (typeof matricResultsYears)[number])
		) {
			return NextResponse.json(
				{ error: `Invalid year. Supported: ${matricResultsYears.join(", ")}` },
				{ status: 400 },
			);
		}

		const results = searchMatricResults(name, year);

		return NextResponse.json({
			results,
			year,
			total: results.length,
		});
	} catch (err) {
		logError("matric-results.GET", err);
		return NextResponse.json(
			{ error: "Failed to search matric results." },
			{ status: 500 },
		);
	}
}

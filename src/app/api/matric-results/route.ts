import { type NextRequest, NextResponse } from "next/server";
import { matricResultsYears, searchMatricResults } from "@/lib/matric-results";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const name = searchParams.get("name") || "";
	const yearParam = searchParams.get("year");

	const year = yearParam
		? Number.parseInt(yearParam, 10)
		: matricResultsYears[0];

	if (!matricResultsYears.includes(year as never)) {
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
}

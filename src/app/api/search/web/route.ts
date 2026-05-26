import { NextResponse } from "next/server";
import { searchWeb } from "@/lib/services/web-search-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			query?: string;
			numResults?: number;
		};
		const { query, numResults } = body;

		if (!query || typeof query !== "string" || query.trim().length < 2) {
			return NextResponse.json(
				{ error: "Query must be at least 2 characters" },
				{ status: 400 },
			);
		}

		const results = await searchWeb(query, { numResults });
		return NextResponse.json({ results });
	} catch (error) {
		console.error("[Web Search API]", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Web search failed",
				results: [],
			},
			{ status: 500 },
		);
	}
}

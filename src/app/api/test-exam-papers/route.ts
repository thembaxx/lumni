import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export async function GET() {
	try {
		const papers = await listDocuments(COLLECTIONS.EXAM_PAPERS);
		return NextResponse.json({
			papers: papers.slice(0, 5),
			count: papers.length,
		});
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to fetch papers",
			},
			{ status: 500 },
		);
	}
}

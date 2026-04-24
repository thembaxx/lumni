import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { examPaper, subject } from "@/lib/db/schema";

export async function GET() {
	const db = getDb();
	try {
		// Try to select from exam_paper
		const papers = await db.select().from(examPaper).limit(5);
		return NextResponse.json({ papers, count: papers.length });
	} catch (err: unknown) {
		const error = err as Error & {
			cause?: Error;
			query?: string;
			params?: unknown[];
		};
		return NextResponse.json(
			{
				message: error.message,
				cause: error.cause?.message,
				query: error.query,
				params: error.params,
				stack: error.stack,
				type: error.constructor.name,
			},
			{ status: 500 },
		);
	}
}

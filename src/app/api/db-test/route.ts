import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { subject } from "@/lib/db/schema";

export async function GET() {
	const db = getDb();

	try {
		const rows = await db.select().from(subject).limit(3);
		return NextResponse.json({ success: true, rows, count: rows.length });
	} catch (err: unknown) {
		const error = err as Error & { cause?: Error; message: string };
		return NextResponse.json(
			{
				success: false,
				error: error.message,
				cause: error.cause?.message,
			},
			{ status: 500 },
		);
	}
}

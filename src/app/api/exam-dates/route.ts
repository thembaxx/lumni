import { NextResponse } from "next/server";
import { getSeedData } from "@/lib/exam-dates/service";
import type { ExamSlot } from "@/lib/exam-dates/types";

export async function GET(request: Request): Promise<NextResponse> {
	const url = new URL(request.url);
	const session = url.searchParams.get("session") || "may-june";
	const yearStr = url.searchParams.get("year") || "2026";
	const year = Number.parseInt(yearStr, 10);

	const slots: ExamSlot[] = getSeedData(session, year);

	return NextResponse.json({
		slots,
		session,
		year,
		count: slots.length,
		updatedAt: new Date().toISOString(),
		source: "seed",
	});
}

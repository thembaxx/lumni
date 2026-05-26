import { NextResponse } from "next/server";
import { getSeedData, syncExamDatesToAppwrite } from "@/lib/exam-dates/service";
import type { ExamSlot } from "@/lib/exam-dates/types";
import { getAuthenticatedUserId } from "@/lib/server/auth";

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

export async function POST(request: Request): Promise<NextResponse> {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const url = new URL(request.url);
		const session = url.searchParams.get("session") || "may-june";
		const yearStr = url.searchParams.get("year") || "2026";
		const year = Number.parseInt(yearStr, 10);
		const body = (await request.json().catch(() => ({}))) as {
			slots?: ExamSlot[];
			syncAppwrite?: boolean;
		};

		if (body.slots && body.slots.length > 0) {
			if (body.syncAppwrite) {
				await syncExamDatesToAppwrite(session, year, body.slots);
			}
			return NextResponse.json({
				success: true,
				session,
				year,
				count: body.slots.length,
			});
		}

		const slots = getSeedData(session, year);
		if (body.syncAppwrite && slots.length > 0) {
			await syncExamDatesToAppwrite(session, year, slots);
		}

		return NextResponse.json({
			success: true,
			session,
			year,
			count: slots.length,
			source: "seed",
		});
	} catch (error) {
		console.error("[exam-dates POST] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to process" },
			{ status: 500 },
		);
	}
}

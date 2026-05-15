import { NextResponse } from "next/server";
import { cleanupOldQuestions } from "@/lib/db/cleanup";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const result = await cleanupOldQuestions();
		return NextResponse.json(result);
	} catch (error) {
		console.error("[Cron Cleanup] Error:", error);
		return NextResponse.json(
			{
				deleted: 0,
				remaining: 0,
				error: error instanceof Error ? error.message : "Cleanup failed",
			},
			{ status: 500 },
		);
	}
}

export { GET as POST };

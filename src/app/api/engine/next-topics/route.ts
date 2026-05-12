import { NextRequest, NextResponse } from "next/server";
import { competencyService, pathEngine } from "@/lib/competency-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const subject = searchParams.get("subject");

		if (!subject) {
			return NextResponse.json(
				{ error: "Subject is required" },
				{ status: 400 },
			);
		}

		const competencies = await competencyService.getCompetencies(subject);
		const competencyMap = new Map(
			competencies.map((c) => [
				`${c.subjectId}:${c.topicId}:${c.bloomLevel}`,
				c,
			]),
		);

		const recommendations = await pathEngine.getNextTopics(
			subject,
			competencyMap,
		);

		const summary = await competencyService.getMasterySummary(subject);

		return NextResponse.json({ recommendations, summary });
	} catch (error) {
		console.error("[Next Topics] Error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to get next topics",
			},
			{ status: 500 },
		);
	}
}

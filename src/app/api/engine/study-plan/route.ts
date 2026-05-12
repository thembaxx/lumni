import { NextRequest, NextResponse } from "next/server";
import { competencyService, pathEngine } from "@/lib/competency-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const subjectsParam = searchParams.get("subjects");
		const days = Math.min(
			Number.parseInt(searchParams.get("days") || "7", 10),
			30,
		);
		const dailyGoalMinutes = Number.parseInt(
			searchParams.get("dailyGoalMinutes") || "30",
			10,
		);

		if (!subjectsParam) {
			return NextResponse.json(
				{ error: "Subjects is required (comma-separated)" },
				{ status: 400 },
			);
		}

		const subjects = subjectsParam.split(",").map((s) => s.trim());

		const allCompetencies: [
			string,
			import("@/lib/competency-engine").CompetencyRecord,
		][] = [];
		for (const subject of subjects) {
			const comps = await competencyService.getCompetencies(subject);
			for (const c of comps) {
				allCompetencies.push([
					`${c.subjectId}:${c.topicId}:${c.bloomLevel}`,
					c,
				]);
			}
		}
		const competencyMap = new Map(allCompetencies);

		const plan = await pathEngine.generateStudyPlan(
			subjects,
			competencyMap,
			days,
			dailyGoalMinutes,
		);

		return NextResponse.json({ plan, days, dailyGoalMinutes });
	} catch (error) {
		console.error("[Study Plan] Error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to generate study plan",
			},
			{ status: 500 },
		);
	}
}

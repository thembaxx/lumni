import { Query } from "appwrite";
import { NextRequest, NextResponse } from "next/server";
import { pathEngine } from "@/lib/competency-engine";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

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

		const allCompetencies: [string, CompetencyRecord][] = [];
		for (const subject of subjects) {
			const docs = await listDocuments<Record<string, unknown>>(
				COLLECTIONS.COMPETENCIES,
				[Query.equal("subjectId", subject)],
			);
			for (const d of docs) {
				const record: CompetencyRecord = {
					subjectId: d.subjectId as string,
					topicId: d.topicId as string,
					bloomLevel: d.bloomLevel as CompetencyRecord["bloomLevel"],
					score: d.score as number,
					attempts: d.attempts as number,
					lastAssessed: d.lastAssessed as number,
					level: d.level as CompetencyRecord["level"],
				};
				allCompetencies.push([
					`${record.subjectId}:${record.topicId}:${record.bloomLevel}`,
					record,
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

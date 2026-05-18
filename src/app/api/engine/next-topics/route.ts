import { Query } from "appwrite";
import { NextRequest, NextResponse } from "next/server";
import { pathEngine } from "@/lib/competency-engine";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

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

		const docs = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.COMPETENCIES,
			[Query.equal("subjectId", subject)],
		);

		const competencies: CompetencyRecord[] = docs.map((d) => ({
			subjectId: d.subjectId as string,
			topicId: d.topicId as string,
			bloomLevel: d.bloomLevel as CompetencyRecord["bloomLevel"],
			score: (d.score as number) ?? (d.proficiency as number) ?? 0,
			attempts: d.attempts as number,
			lastAssessed: d.lastAssessed as number,
			level: d.level as CompetencyRecord["level"],
		}));

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

		const total = competencies.length;
		const novice = competencies.filter((c) => c.level === "novice").length;
		const developing = competencies.filter(
			(c) => c.level === "developing",
		).length;
		const proficient = competencies.filter(
			(c) => c.level === "proficient",
		).length;
		const mastered = competencies.filter((c) => c.level === "mastered").length;
		const averageScore =
			total > 0
				? Math.round(
						(competencies.reduce((s, c) => s + c.score, 0) / total) * 100,
					) / 100
				: 0;

		return NextResponse.json({
			recommendations,
			summary: {
				total,
				novice,
				developing,
				proficient,
				mastered,
				averageScore,
			},
		});
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

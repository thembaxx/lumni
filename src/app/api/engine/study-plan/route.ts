import { Query } from "appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { pathEngine } from "@/lib/competency-engine";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const GET = withRateLimit(
  createRouteHandler({
    auth: "required",
    execute: async ({ req }) => {
      const { searchParams } = new URL(req.url);
      const subjectsParam = searchParams.get("subjects");
      const days = Math.min(Number.parseInt(searchParams.get("days") || "7", 10), 30);
      const dailyGoalMinutes = Number.parseInt(searchParams.get("dailyGoalMinutes") || "30", 10);

      if (!subjectsParam) {
        throw new HttpError(400, "Subjects is required (comma-separated)");
      }

      const subjects = subjectsParam.split(",").map((s) => s.trim());

      const allDocs = await Promise.all(
        subjects.map((subject) =>
          listDocuments<Record<string, unknown>>(COLLECTIONS.COMPETENCIES, [
            Query.equal("subjectId", subject),
          ]),
        ),
      );
      const allCompetencies: [string, CompetencyRecord][] = [];
      for (const docs of allDocs) {
        for (const d of docs) {
          const record: CompetencyRecord = {
            subjectId: d.subjectId as string,
            topicId: d.topicId as string,
            bloomLevel: d.bloomLevel as CompetencyRecord["bloomLevel"],
            score: (d.score as number) ?? (d.proficiency as number) ?? 0,
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

      return { plan, days, dailyGoalMinutes };
    },
    errorLabel: "Study Plan",
  }),
  { max: 5, windowMs: 60000 },
);

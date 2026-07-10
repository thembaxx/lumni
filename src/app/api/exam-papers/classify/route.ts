import { type NextRequest, NextResponse } from "next/server";
import { dexieDataAccess } from "@/lib/db";
import type { LegacyDataAccess } from "@/lib/db/data-access";
type DataAccess = Pick<LegacyDataAccess, "pastPaperQuestions">;
import { classifyQuestions } from "@/lib/exam-paper-ingestion/question-classifier";
import { requireAdmin } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  return response;
}

export function createClassifyHandler(db: DataAccess = dexieDataAccess) {
  return withRateLimit(
    async (req: NextRequest) => {
      try {
        await requireAdmin();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Admin access required";
        if (msg.includes("Authentication required")) {
          return addSecurityHeaders(NextResponse.json({ error: msg }, { status: 401 }));
        }
        return addSecurityHeaders(NextResponse.json({ error: msg }, { status: 403 }));
      }

      let body: { subject?: string };
      try {
        body = await req.json();
      } catch {
        return addSecurityHeaders(
          NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 }),
        );
      }

      const subject = body?.subject;
      if (!subject) {
        return addSecurityHeaders(
          NextResponse.json({ error: "subject is required" }, { status: 400 }),
        );
      }

      const pastPaperQuestions = db.pastPaperQuestions;
      const all = await pastPaperQuestions.where("subject").equals(subject).toArray();

      const allById = new Map(all.map((q) => [q.id, q]));

      const unclassified = all.reduce<{ id: string; questionText: string; subject: string }[]>(
        (acc, q) => {
          if (!q.subtopicId) {
            acc.push({ id: q.id, questionText: q.questionText, subject: q.subject });
          }
          return acc;
        },
        [],
      );

      if (unclassified.length === 0) {
        return addSecurityHeaders(
          NextResponse.json({
            total: 0,
            classified: 0,
            message: "All questions already classified",
          }),
        );
      }

      const curriculumTopics = all.reduce<
        { id: string; subject: string; topic: string; subtopic: string }[]
      >((acc, q) => {
        if (q.topic) {
          const topic = q.topic;
          acc.push({ id: topic, subject: q.subject, topic, subtopic: topic });
        }
        return acc;
      }, []);

      const classifications = await classifyQuestions(unclassified, curriculumTopics);

      for (const [questionId, subtopicId] of classifications) {
        const question = allById.get(questionId);
        if (question) {
          await pastPaperQuestions.update(questionId, { subtopicId });
        }
      }

      return addSecurityHeaders(
        NextResponse.json({
          total: unclassified.length,
          classified: classifications.size,
        }),
      );
    },
    { max: 3, windowMs: 120000 },
  );
}

export const POST = createClassifyHandler();

import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "PastPaperQuestions",
  execute: async ({ req }) => {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic");
    const subtopicId = searchParams.get("subtopicId");
    const type = searchParams.get("type");
    const yearParam = searchParams.get("year");
    const sort = searchParams.get("sort") || "-year";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

    const filters: string[] = [];
    if (subject) filters.push(Query.equal("subject", subject));
    if (topic) filters.push(Query.equal("topic", topic));
    if (subtopicId) filters.push(Query.equal("subtopicId", subtopicId));
    if (type) filters.push(Query.equal("questionType", type));
    if (yearParam) filters.push(Query.equal("year", parseInt(yearParam, 10)));

    const order = sort.startsWith("-") ? Query.orderDesc(sort.slice(1)) : Query.orderAsc(sort);

    const docs = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PAST_PAPER_QUESTIONS,
      [...filters, order, Query.limit(limit)],
    );

    const questions = docs.documents.map(
      (d) =>
        ({
          id: d.id,
          subject: d.subject,
          topic: d.topic,
          subtopicId: d.subtopicId,
          year: d.year,
          paperNumber: d.paperNumber,
          sectionTitle: d.sectionTitle,
          questionId: d.questionId,
          partId: d.partId,
          questionText: d.questionText,
          answerText: d.answerText,
          marks: d.marks,
          questionType: d.questionType,
          bloomLevel: d.bloomLevel,
          createdAt: d.createdAt,
        }) as PastPaperQuestion,
    );

    return { questions };
  },
});

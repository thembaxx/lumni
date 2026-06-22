import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import type { SearchResultItem } from "@/lib/services/search-service";

export const dynamic = "force-dynamic";

function textRelevant(text: string, query: string): boolean {
  const q = query.toLowerCase();
  return text.toLowerCase().includes(q);
}

export const GET = createRouteHandler({
  auth: "optional",
  errorLabel: "AppwriteSearch",
  execute: async ({ userId, req }) => {
    if (!userId) {
      return { results: [] };
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    if (!query || query.trim().length < 2) {
      return { results: [] };
    }

    const results: SearchResultItem[] = [];

    if (APPWRITE_DATABASE_ID) {
      try {
        const questionsRes = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.QUESTIONS,
          [Query.equal("userId", userId), Query.limit(25)],
        );
        for (const doc of questionsRes.documents) {
          const text = doc.questionText as string;
          if (textRelevant(text, query)) {
            results.push({
              id: `aw-q-${doc.$id}`,
              type: "question",
              title: text.slice(0, 120),
              snippet: text,
              subject: (doc.subject as string) || "",
              topic: (doc.topicId as string) || "",
              createdAt: new Date(doc.createdAt as string).getTime(),
            });
          }
        }
      } catch {
        // Questions collection may not exist or be accessible
      }

      try {
        const examSessionsRes = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.EXAM_SESSIONS,
          [Query.equal("userId", userId), Query.limit(25)],
        );
        for (const doc of examSessionsRes.documents) {
          const examPaperId = doc.examPaperId as string;
          if (textRelevant(examPaperId, query)) {
            results.push({
              id: `aw-es-${doc.$id}`,
              type: "exam-session",
              title: examPaperId,
              snippet: doc.completed ? "Completed" : "In progress",
              subject: "",
              createdAt: new Date(doc.createdAt as string).getTime(),
            });
          }
        }
      } catch {
        // Exam sessions collection may not exist
      }

      try {
        const wrongAnswersRes = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.WRONG_ANSWERS,
          [Query.equal("userId", userId), Query.limit(25)],
        );
        for (const doc of wrongAnswersRes.documents) {
          const questionText = doc.questionText as string;
          const correctAnswer = doc.correctAnswer as string;
          if (textRelevant(questionText, query) || textRelevant(correctAnswer || "", query)) {
            results.push({
              id: `aw-wa-${doc.$id}`,
              type: "wrong-answer",
              title: questionText.slice(0, 120),
              snippet: `${(correctAnswer || "").slice(0, 100)}...`,
              subject: (doc.subject as string) || "",
              topic: (doc.topic as string) || "",
              createdAt: new Date(doc.createdAt as string).getTime(),
            });
          }
        }
      } catch {
        // Wrong answers collection may not exist
      }
    }

    return { results: results.slice(0, 25) };
  },
});

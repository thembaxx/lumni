import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import type { Question } from "@/lib/question-engine/types";
import { shareQuestion } from "@/lib/share/share-service";
import { getSourceForQuestion } from "@/lib/tinyfish";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "ShareQuestion",
  validate: (body) => {
    if (!body.question || !body.subject) return "question and subject required";
    return null;
  },
  execute: async ({ userId, body }) => {
    const { question, subject, topic } = body as {
      question: unknown;
      subject: string;
      topic?: string;
    };

    let sources: { url: string; title: string }[] | undefined;
    try {
      const questionObj = question as { questionText?: string };
      const questionText = questionObj?.questionText ?? "";
      if (questionText.trim()) {
        const ragContext = await getSourceForQuestion({
          question: questionText,
          userId: userId as string,
        });
        sources =
          ragContext?.sources?.map((s) => ({
            url: s.url,
            title: s.title,
          })) ?? [];
      }
    } catch {
      /* RAG failure should not break sharing */
    }

    const id = await shareQuestion(
      question as Question,
      subject.toLowerCase(),
      topic ?? "general",
      userId as string,
      sources,
    );

    return {
      success: true,
      id,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://lumni-psi.vercel.app"}/q/${id}`,
    };
  },
});

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "ShareList",
  execute: async ({ userId }) => {
    const { listDocuments } = await import("@/lib/db/client");
    const { COLLECTIONS } = await import("@/lib/db/constants");
    const { Query } = await import("appwrite");

    const docs = await listDocuments<Record<string, unknown>>(COLLECTIONS.SHARED_QUESTIONS, [
      Query.equal("sharedById", userId as string),
    ]);

    const shares = docs.map((doc) => ({
      id: doc.id as string,
      subject: doc.subject as string,
      topic: doc.topic as string,
      questionText: typeof doc.question === "string" ? extractPreview(doc.question) : "",
      sharedAt:
        typeof doc.sharedAt === "string"
          ? new Date(doc.sharedAt).getTime()
          : (doc.sharedAt as number),
      viewCount: (doc.viewCount as number) ?? 0,
    }));

    return { shares };
  },
});

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "ShareDelete",
  execute: async ({ userId, body }) => {
    const { shareId } = body as { shareId: string };
    if (!shareId) throw new HttpError(400, "shareId required");

    const { listDocuments, deleteDocument } = await import("@/lib/db/client");
    const { COLLECTIONS } = await import("@/lib/db/constants");
    const { Query } = await import("appwrite");

    const docs = await listDocuments<Record<string, unknown>>(COLLECTIONS.SHARED_QUESTIONS, [
      Query.equal("id", shareId),
    ]);

    if (docs.length === 0) throw new HttpError(404, "Share not found");

    const doc = docs[0];
    if (doc.sharedById !== userId) throw new HttpError(403, "Not your share");

    await deleteDocument(COLLECTIONS.SHARED_QUESTIONS, doc.$id as string);

    try {
      const { dexieDataAccess } = await import("@/lib/db/dexie-data-access");
      await dexieDataAccess.sharedQuestions.where("id").equals(shareId).delete();
    } catch {
      /* best-effort local cleanup */
    }

    return { ok: true };
  },
});

function extractPreview(questionJson: string): string {
  try {
    const parsed = JSON.parse(questionJson);
    return typeof parsed.questionText === "string"
      ? parsed.questionText.slice(0, 120)
      : (parsed.questionText ?? JSON.stringify(parsed).slice(0, 120));
  } catch {
    return questionJson.slice(0, 120);
  }
}

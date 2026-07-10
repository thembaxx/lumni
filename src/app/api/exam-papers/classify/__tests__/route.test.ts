import { describe, it, expect, vi, beforeEach } from "vitest";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";
import { createClassifyHandler } from "../route";

vi.mock("@/lib/server/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue("admin-id"),
}));

vi.mock("@/lib/exam-paper-ingestion/question-classifier", () => ({
  classifyQuestions: vi.fn().mockResolvedValue(new Map([["q-unclassified-1", "topic-1"]])),
}));

function mockRequest(body: unknown): Request {
  return new Request("http://localhost/api/exam-papers/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/exam-papers/classify", () => {
  let db: InMemoryDataAccess;

  beforeEach(() => {
    db = new InMemoryDataAccess();
  });

  it("returns 400 when subject is missing", async () => {
    const handler = createClassifyHandler(db);
    const res = await handler(mockRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("subject is required");
  });

  it("returns early when all questions already classified", async () => {
    db.pastPaperQuestions.seed([
      {
        id: "q-1",
        subject: "Mathematics",
        topic: "Algebra",
        subtopicId: "alg-1",
        year: 2024,
        paperNumber: 1,
        questionId: "1",
        partId: "a",
        questionText: "Solve x+2=5",
        answerText: "3",
        marks: 2,
        questionType: "short-answer",
        createdAt: new Date().toISOString(),
      },
    ]);
    const handler = createClassifyHandler(db);
    const res = await handler(mockRequest({ subject: "Mathematics" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("All questions already classified");
    expect(json.total).toBe(0);
  });

  it("returns 200 and classifies unclassified questions", async () => {
    db.pastPaperQuestions.seed([
      {
        id: "q-unclassified-1",
        subject: "Mathematics",
        topic: "Algebra",
        year: 2024,
        paperNumber: 1,
        questionId: "1",
        partId: "a",
        questionText: "Solve x+2=5",
        answerText: "3",
        marks: 2,
        questionType: "short-answer",
        createdAt: new Date().toISOString(),
      },
      {
        id: "q-classified-1",
        subject: "Mathematics",
        topic: "Geometry",
        subtopicId: "geo-1",
        year: 2024,
        paperNumber: 1,
        questionId: "2",
        partId: "a",
        questionText: "Area of circle",
        answerText: "πr²",
        marks: 3,
        questionType: "short-answer",
        createdAt: new Date().toISOString(),
      },
    ]);
    const handler = createClassifyHandler(db);
    const res = await handler(mockRequest({ subject: "Mathematics" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.classified).toBe(1);
  });
});

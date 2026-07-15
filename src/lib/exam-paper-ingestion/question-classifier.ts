import { type AIClient, getAI } from "@/lib/ai/client";
import { logError } from "@/lib/shared/logger";

export interface CurriculumTopic {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  bloomTarget?: string;
}

const BATCH_SIZE = 50;

function buildPrompt(
  batch: Array<{ id: string; questionText: string; subject: string }>,
  curriculumTopics: CurriculumTopic[],
): string {
  const topicsList = curriculumTopics
    .map((t) => `  - id: "${t.id}" | ${t.topic} → ${t.subtopic}`)
    .join("\n");

  const questionsJson = batch.map((q) => ({
    id: q.id,
    questionText: q.questionText.slice(0, 500),
  }));

  return `You are classifying past exam questions against curriculum subtopics.

Curriculum subtopics:
${topicsList}

Questions to classify:
${JSON.stringify(questionsJson, null, 2)}

For each question, assign the subtopic id that best matches. Use only ids from the curriculum list above. If no good match exists, return null for that question.

Return ONLY valid JSON: {"questionId": "subtopicId" | null, ...}`;
}

function parseResponse(raw: string, validIds: Set<string>): Map<string, string> {
  const result = new Map<string, string>();
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return result;
    }
    for (const [questionId, subtopicId] of Object.entries(parsed)) {
      if (
        typeof questionId === "string" &&
        typeof subtopicId === "string" &&
        validIds.has(subtopicId)
      ) {
        result.set(questionId, subtopicId);
      }
    }
  } catch {
    // Return empty map on parse failure
  }
  return result;
}

export async function classifyQuestions(
  questions: Array<{ id: string; questionText: string; subject: string }>,
  curriculumTopics: CurriculumTopic[],
  ai?: AIClient,
): Promise<Map<string, string>> {
  if (questions.length === 0) return new Map();

  const client = ai ?? getAI();
  const validIds = new Set(curriculumTopics.map((t) => t.id));
  const classifications = new Map<string, string>();

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const prompt = buildPrompt(batch, curriculumTopics);

    try {
      const response = await client.generateWithSystem(
        "You are a CAPS curriculum expert. Classify questions accurately. Return ONLY valid JSON.",
        prompt,
      );
      if (!("content" in response) || !response.content) {
        throw new Error("Empty AI response");
      }
      const batchClassifications = parseResponse(response.content, validIds);
      for (const [k, v] of batchClassifications) {
        classifications.set(k, v);
      }
    } catch (err) {
      logError("QuestionClassifier", err, {
        batchIndex: Math.floor(i / BATCH_SIZE),
      });
    }
  }

  return classifications;
}

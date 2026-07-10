import seedData from "@/data/seed-questions-interactive.json";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import type { Question } from "@/lib/question-engine/types";
import type { QuizDataAccess } from "@/lib/db";

export async function seedInteractiveQuestions(): Promise<number> {
  const db: Pick<QuizDataAccess, "questions"> = dexieDataAccess;
  const existing = await db.questions.where("subject").startsWith("seed-").count();

  if (existing > 0) return 0;

  const subjects = new Map<string, Question[]>();
  for (const q of seedData as unknown as Question[]) {
    const key = `${q.subject}-${q.topic}`;
    if (!subjects.has(key)) subjects.set(key, []);
    subjects.get(key)?.push(q);
  }

  let count = 0;
  for (const [key, questions] of subjects) {
    await db.questions.put({
      subject: `seed-${key}`,
      topic: key,
      questions: JSON.stringify(questions),
      cachedAt: Date.now(),
    });
    count += questions.length;
  }

  return count;
}

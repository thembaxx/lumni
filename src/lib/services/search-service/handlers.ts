import { flashcardEngine } from "@/lib/flashcard-engine";
import { logError } from "@/lib/shared/logger";
import { getDeps } from "./deps";
import { createTableSearch, textRelevant } from "./factory";
import type { SearchResultItem } from "./types";

export const searchDexieQuestions = createTableSearch("questions", (row, query) => {
  const questions: Array<{ id: string; questionText: string; topic: string }> = JSON.parse(
    (row.questions as string) || "[]",
  );
  for (const q of questions) {
    if (textRelevant(q.questionText, query)) {
      return {
        id: `q-${q.id}`,
        type: "question" as const,
        title: q.questionText.slice(0, 120),
        snippet: q.questionText,
        subject: row.subject as string,
        topic: q.topic || (row.topic as string),
        createdAt: row.cachedAt as number,
      };
    }
  }
  return null;
});

export const searchDexieWrongAnswers = createTableSearch("wrongAnswers", (row, query) => {
  if (
    textRelevant(row.questionText as string, query) ||
    textRelevant(row.correctAnswer as string, query) ||
    textRelevant((row.explanation as string) || "", query)
  ) {
    return {
      id: `wa-${row.id}`,
      type: "wrong-answer" as const,
      title: (row.questionText as string).slice(0, 120),
      snippet: `${(row.correctAnswer as string).slice(0, 100)}...`,
      subject: row.subject as string,
      topic: row.topic as string,
      createdAt: row.createdAt as number,
    };
  }
  return null;
});

export const searchDexieQuizAttempts = createTableSearch("quizAttempts", (row, query) => {
  if (textRelevant(row.odSubject as string, query)) {
    return {
      id: `qa-${row.id}`,
      type: "quiz-attempt" as const,
      title: `${row.odSubject} — ${row.score}/${row.totalQuestions}`,
      snippet: `Score: ${row.score}/${row.totalQuestions} (${Math.round(((row.score as number) / (row.totalQuestions as number)) * 100)}%)`,
      subject: row.odSubject as string,
      createdAt: row.completedAt as number,
    };
  }
  return null;
});

export const searchDexieExamSessions = createTableSearch("examSessions", (row, query) => {
  if (textRelevant(row.paperId as string, query)) {
    return {
      id: `es-${row.id}`,
      type: "exam-session" as const,
      title: row.paperId as string,
      snippet: row.completed ? "Completed" : "In progress",
      subject: "",
      createdAt: row.startedAt as number,
    };
  }
  return null;
});

export const searchDexieProgress = createTableSearch("progress", (row, query) => {
  if (textRelevant(row.odSubjectId as string, query)) {
    return {
      id: `pr-${row.id}`,
      type: "progress" as const,
      title: row.odSubjectId as string,
      snippet: `${row.questionsAttempted} questions, ${Math.round(((row.correctCount as number) / Math.max(row.questionsAttempted as number, 1)) * 100)}% correct`,
      subject: row.odSubjectId as string,
      createdAt: row.updatedAt as number,
    };
  }
  return null;
});

export const searchDexieStudyGuides = createTableSearch("studyGuides", (row, query) => {
  if (textRelevant(row.key as string, query)) {
    return {
      id: `sg-${row.key}`,
      type: "study-set" as const,
      title: row.key as string,
      snippet: `Study guide — expires ${new Date(row.expiresAt as number).toLocaleDateString()}`,
      subject: (row.key as string).split(":")[0] ?? "",
      createdAt: row.createdAt as number,
    };
  }
  return null;
});

export const searchDexieDictionary = createTableSearch("dictionaryCache", (row, query) => {
  const defs = ((row.result as { definitions?: { definition: string }[] })?.definitions ?? [])
    .map((d: { definition: string }) => d.definition)
    .join(" ");
  if (textRelevant(row.word as string, query) || textRelevant(defs, query)) {
    return {
      id: `dict-${row.key}`,
      type: "dictionary" as const,
      title: row.word as string,
      snippet: defs.slice(0, 150),
      subject: "Dictionary",
      createdAt: Date.now(),
    };
  }
  return null;
});

export const searchDexieStories = createTableSearch("storyCache", (row, query) => {
  const story = row.story as {
    id: string;
    title: string;
    content: string;
    author: string;
    subjects?: string[];
    topics?: string[];
  };
  if (
    textRelevant(story.title, query) ||
    textRelevant(story.content, query) ||
    textRelevant(story.author, query) ||
    (story.topics || []).some((t) => textRelevant(t, query))
  ) {
    return {
      id: `story-${story.id}`,
      type: "story" as const,
      title: story.title,
      snippet: story.content.slice(0, 150),
      subject: (story.subjects || []).join(", "),
      createdAt: row.createdAt as number,
    };
  }
  return null;
});

export const searchDexieLessons = createTableSearch("lessonCache", (row, query) => {
  const lesson = row.lesson as {
    id: string;
    title: string;
    sections: Array<{ content: string; keyPoints?: string[] }>;
    subjectId: string;
    topicId: string;
    vocabulary?: Array<{ word: string; definition: string }>;
  };
  if (textRelevant(lesson.title, query)) {
    return {
      id: `lesson-${lesson.id}`,
      type: "lesson" as const,
      title: lesson.title,
      snippet: `Lesson — ${lesson.sections.length} sections`,
      subject: lesson.subjectId,
      topic: lesson.topicId,
      createdAt: row.createdAt as number,
    };
  }
  for (const s of lesson.sections) {
    if (
      textRelevant(s.content, query) ||
      (s.keyPoints || []).some((kp) => textRelevant(kp, query))
    ) {
      return {
        id: `lesson-${lesson.id}`,
        type: "lesson" as const,
        title: lesson.title,
        snippet: s.content.slice(0, 150),
        subject: lesson.subjectId,
        topic: lesson.topicId,
        createdAt: row.createdAt as number,
      };
    }
  }
  for (const v of lesson.vocabulary || []) {
    if (textRelevant(v.word, query) || textRelevant(v.definition, query)) {
      return {
        id: `lesson-${lesson.id}`,
        type: "lesson" as const,
        title: lesson.title,
        snippet: `${v.word}: ${v.definition.slice(0, 100)}`,
        subject: lesson.subjectId,
        topic: lesson.topicId,
        createdAt: row.createdAt as number,
      };
    }
  }
  return null;
});

export const searchDexieVocabulary = createTableSearch("vocabularyList", (row, query) => {
  if (
    textRelevant(row.word as string, query) ||
    textRelevant(row.definition as string, query) ||
    textRelevant((row.sourceLesson as string) || "", query)
  ) {
    return {
      id: `vocab-${row.id}`,
      type: "vocabulary" as const,
      title: row.word as string,
      snippet: (row.definition as string).slice(0, 150),
      subject: row.language as string,
      createdAt: row.addedAt as number,
    };
  }
  return null;
});

export async function searchDexieFlashcards(query: string): Promise<SearchResultItem[]> {
  const flashcards = await flashcardEngine.getAll();
  const results: SearchResultItem[] = [];
  for (const c of flashcards) {
    if (
      textRelevant(c.front, query) ||
      textRelevant(c.back, query) ||
      textRelevant(c.topic || "", query)
    ) {
      results.push({
        id: `fc-${c.id}`,
        type: "flashcard",
        title: c.front.slice(0, 120),
        snippet: c.back.slice(0, 100),
        subject: c.subject,
        topic: c.topic,
        createdAt: c.createdAt,
      });
      if (results.length >= 10) break;
    }
  }
  return results;
}

export async function searchNotes(query: string): Promise<SearchResultItem[]> {
  const results: SearchResultItem[] = [];
  try {
    const all = await getDeps().db.notes.toArray();
    for (const n of all) {
      if (
        textRelevant(n.title, query) ||
        textRelevant(n.content, query) ||
        (n.tags || []).some((t) => textRelevant(t, query))
      ) {
        results.push({
          id: `note-${n.uuid}`,
          type: "note",
          title: n.title,
          snippet: n.content.slice(0, 150),
          subject: n.subject || "",
          topic: n.topic,
          createdAt: new Date(n.createdAt).getTime(),
        });
        if (results.length >= 10) break;
      }
    }
  } catch {
    logError("SearchNotes", new Error("Failed to search notes"));
  }
  return results;
}

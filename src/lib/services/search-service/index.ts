import { logError } from "@/lib/shared/logger";
import {
  searchDexieDictionary,
  searchDexieExamSessions,
  searchDexieFlashcards,
  searchDexieKnowledgeGraph,
  searchDexieLessons,
  searchDexieProgress,
  searchDexiePronunciationHistory,
  searchDexieQuestions,
  searchDexieQuizAttempts,
  searchDexieStories,
  searchDexieStudyGuides,
  searchDexieVocabulary,
  searchDexieWrongAnswers,
  searchNotes,
} from "./handlers";
import type { SearchResultItem } from "./types";

const SEARCH_HANDLERS: Record<string, (query: string) => Promise<SearchResultItem[]>> = {
  question: searchDexieQuestions,
  "wrong-answer": searchDexieWrongAnswers,
  flashcard: searchDexieFlashcards,
  note: (q) => searchNotes(q),
  "quiz-attempt": searchDexieQuizAttempts,
  "exam-session": searchDexieExamSessions,
  progress: searchDexieProgress,
  "study-guide": searchDexieStudyGuides,
  dictionary: searchDexieDictionary,
  story: searchDexieStories,
  lesson: searchDexieLessons,
  vocabulary: searchDexieVocabulary,
  pronunciation: searchDexiePronunciationHistory,
  "knowledge-graph": searchDexieKnowledgeGraph,
};

async function searchAppwrite(query: string): Promise<SearchResultItem[]> {
  try {
    const res = await fetch(`/api/search/appwrite?query=${encodeURIComponent(query)}`, {
      method: "GET",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results: SearchResultItem[] };
    return data.results ?? [];
  } catch (err) {
    logError("SearchAppwrite", err);
    return [];
  }
}

export async function searchAll(query: string): Promise<SearchResultItem[]> {
  if (!query.trim() || query.length < 2) return [];

  const local = await Promise.all([
    searchDexieQuestions(query),
    searchDexieWrongAnswers(query),
    searchDexieFlashcards(query),
    searchNotes(query),
    searchDexieQuizAttempts(query),
    searchDexieExamSessions(query),
    searchDexieProgress(query),
    searchDexieStudyGuides(query),
    searchDexieDictionary(query),
    searchDexieStories(query),
    searchDexieLessons(query),
    searchDexieVocabulary(query),
    searchDexiePronunciationHistory(query),
    searchDexieKnowledgeGraph(query),
  ]);

  const localResults = local.flat();
  if (localResults.length >= 25) return localResults.slice(0, 25);

  const appwriteResults = await searchAppwrite(query);
  return [...localResults, ...appwriteResults].slice(0, 25);
}

export async function searchWeb(query: string): Promise<SearchResultItem[]> {
  try {
    const res = await fetch("/api/search/web", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, numResults: 6 }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results: SearchResultItem[] };
    return data.results ?? [];
  } catch (err) {
    logError("SearchWeb", err);
    return [];
  }
}

export async function searchByType(
  query: string,
  type: SearchResultItem["type"],
): Promise<SearchResultItem[]> {
  if (!query.trim() || query.length < 2) return [];
  const handler = SEARCH_HANDLERS[type];
  if (!handler) return [];
  return handler(query);
}

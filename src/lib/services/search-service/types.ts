import type { DataAccess } from "@/lib/db/data-access";

export type SearchDb = Pick<
  DataAccess,
  | "questions"
  | "wrongAnswers"
  | "quizAttempts"
  | "examSessions"
  | "progress"
  | "studyGuides"
  | "dictionaryCache"
  | "storyCache"
  | "lessonCache"
  | "vocabularyList"
  | "notes"
>;

export interface SearchResultItem {
  id: string;
  type:
    | "question"
    | "flashcard"
    | "wrong-answer"
    | "note"
    | "study-set"
    | "exam"
    | "web"
    | "quiz-attempt"
    | "exam-session"
    | "progress"
    | "study-guide"
    | "dictionary"
    | "story"
    | "lesson"
    | "vocabulary";
  title: string;
  snippet: string;
  subject: string;
  topic?: string;
  createdAt: number;
  url?: string;
}

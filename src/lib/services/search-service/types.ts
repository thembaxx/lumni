import type {
  CacheDataAccess,
  QuizDataAccess,
  SyncDataAccess,
  CompetencyDataAccess,
  StudyDataAccess,
  DictionaryDataAccess,
  StoryDataAccess,
  LessonDataAccess,
  VocabularyDataAccess,
  ContentDataAccess,
  PronunciationDataAccess,
} from "@/lib/db";

export type SearchDb = QuizDataAccess &
  SyncDataAccess &
  CompetencyDataAccess &
  StudyDataAccess &
  CacheDataAccess &
  PronunciationDataAccess &
  DictionaryDataAccess &
  StoryDataAccess &
  LessonDataAccess &
  VocabularyDataAccess &
  ContentDataAccess;

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
    | "vocabulary"
    | "pronunciation"
    | "knowledge-graph";
  title: string;
  snippet: string;
  subject: string;
  topic?: string;
  createdAt: number;
  url?: string;
}

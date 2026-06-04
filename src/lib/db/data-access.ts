import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type {
	AnalyticsEvent,
	BookmarkRecord,
	CachedProgress,
	CachedQuestion,
	CachedSubject,
	CachedVisual,
	QuizAttempt,
	RetentionRecurrence,
} from "@/lib/db/schema";
import type {
	FlashcardReview,
	FlashcardSM2,
} from "@/lib/flashcard-engine/types";
import type { QuizPack, QuizPackQuestion } from "@/lib/quiz-packs/types";

// ──────────────────────────────────────────────
// Generic query interfaces
// ──────────────────────────────────────────────

export interface Collection<T> {
	first(): Promise<T | undefined>;
	toArray(): Promise<T[]>;
	count(): Promise<number>;
	delete(): Promise<void>;
	reverse(): Collection<T>;
	limit(n: number): Collection<T>;
	filter(pred: (item: T) => boolean): Collection<T>;
	sortBy(index: string): Promise<T[]>;
}

export interface WhereClause<T> {
	equals(val: unknown): Collection<T>;
	belowOrEqual(val: unknown): Collection<T>;
	below(val: unknown): Collection<T>;
	startsWith(val: string): Collection<T>;
	anyOf(vals: unknown[]): Collection<T>;
}

// ──────────────────────────────────────────────
// Generic table interface
// ──────────────────────────────────────────────

export interface DataAccessTable<T, TId extends string | number = number> {
	get(id: TId): Promise<T | undefined>;
	add(item: Omit<T, "id">): Promise<TId>;
	put(item: T): Promise<TId>;
	update(id: TId, changes: Partial<T>): Promise<TId>;
	delete(id: TId): Promise<void>;

	bulkAdd(items: Omit<T, "id">[]): Promise<TId[]>;
	bulkDelete(ids: TId[]): Promise<void>;

	toArray(): Promise<T[]>;
	count(): Promise<number>;
	clear(): Promise<void>;

	where(index: string): WhereClause<T>;
	orderBy(index: string): Collection<T>;
}

// ──────────────────────────────────────────────
// DataAccess seam — one accessor per table
// ──────────────────────────────────────────────

export interface DataAccess {
	flashcards: DataAccessTable<FlashcardSM2, string>;
	reviewHistory: DataAccessTable<FlashcardReview, number>;
	analyticsEvents: DataAccessTable<AnalyticsEvent, number>;
	retentionRecurrence: DataAccessTable<RetentionRecurrence, number>;
	wrongAnswers: DataAccessTable<WrongAnswerEntry, number>;
	quizPacks: DataAccessTable<QuizPack, string>;
	packQuestions: DataAccessTable<QuizPackQuestion, number>;
	competencies: DataAccessTable<CompetencyRecord, number>;
	progress: DataAccessTable<CachedProgress, number>;
	quizAttempts: DataAccessTable<QuizAttempt, number>;
	bookmarks: DataAccessTable<BookmarkRecord, number>;
	questions: DataAccessTable<CachedQuestion, number>;
	subjects: DataAccessTable<CachedSubject, number>;
	visuals: DataAccessTable<CachedVisual, number>;
}

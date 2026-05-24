import { flashcardEngine } from "@/lib/flashcard-engine";
import type {
	CardStatus,
	FlashcardReview,
	FlashcardSM2,
	SM2Quality,
	SRSAlgorithm,
} from "@/lib/flashcard-engine";
import { SM2_QUALITIES } from "@/lib/flashcard-engine";
import type { SRSettings } from "@/lib/flashcard-engine";
import {
	DEFAULT_SR_SETTINGS,
} from "@/lib/flashcard-engine";

export {
	calculateNextReviewFSRS,
	getRetrievability,
	initFSRS,
} from "@/lib/orchestrator/fsrs";
export {
	calculateNextReview,
	computeNextReviewDate,
} from "@/lib/orchestrator/sm2";
export type {
	CardStatus,
	FlashcardReview,
	FlashcardSM2,
	SM2Quality,
	SRSAlgorithm,
	SRSettings,
};
export {
	DEFAULT_SR_SETTINGS,
	SM2_QUALITIES,
};

export {
	flashcardEngine,
	flashcardEngine as flashcardRepository,
} from "@/lib/flashcard-engine";

// Backward-compat wrappers
export const loadSRSettings = () => flashcardEngine.loadSettings();
export const saveSRSettings = (settings: SRSettings) => flashcardEngine.saveSettings(settings);
export const resetSRSettings = () => flashcardEngine.resetSettings();
export const resetDailyBudget = () => flashcardEngine.resetDailyBudget();

export const createFlashcard = (front: string, back: string, subject: string, topic?: string) =>
	flashcardEngine.create(front, back, subject, topic);

export const deleteFlashcard = (id: string) => flashcardEngine.delete(id);

export const updateFlashcard = (id: string, updates: Partial<FlashcardSM2>) =>
	flashcardEngine.update(id, updates);

export const reviewFlashcard = (id: string, quality: number) =>
	flashcardEngine.review(id, quality);

export const getDueCards = (subject?: string) =>
	flashcardEngine.getDueCards(subject);

export const getNewCards = (subject?: string, limit?: number) =>
	flashcardEngine.getNewCards(subject, limit);

export const getAllCardsGrouped = () =>
	flashcardEngine.getGrouped();

export const getCardStats = () =>
	flashcardEngine.getStats();

export const getMasteryLevel = (interval: number) =>
	flashcardEngine.getMasteryLevel(interval);

export const getIntervalLabel = (interval: number) =>
	flashcardEngine.getIntervalLabel(interval);

export const buryFlashcard = (id: string) => flashcardEngine.bury(id);
export const suspendFlashcard = (id: string) => flashcardEngine.suspend(id);
export const activateFlashcard = (id: string) => flashcardEngine.activate(id);

export const getReviewHistory = (cardId: string) =>
	flashcardEngine.getReviewHistory(cardId);

export const convertQuizToFlashcards = (
	questions: Array<{
		id: string;
		questionText: string;
		options: Array<{ text: string; isCorrect: boolean }>;
		explanation: string;
	}>,
	subject: string,
) => flashcardEngine.convertQuizToFlashcards(questions, subject);

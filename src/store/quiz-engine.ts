import { create } from "zustand";
import type { QAQuestion } from "@/types/questions";

interface QuizResults {
	correct: number;
	incorrect: number;
	skipped: number;
}

interface QuizEngineState {
	questions: QAQuestion[];
	currentIndex: number;
	selectedAnswer: string | null;
	showFeedback: boolean;
	loading: boolean;
	isComplete: boolean;
	results: QuizResults;

	setQuestions: (questions: QAQuestion[]) => void;
	setCurrentIndex: (index: number) => void;
	setSelectedAnswer: (answer: string | null) => void;
	setShowFeedback: (show: boolean) => void;
	setLoading: (loading: boolean) => void;
	setIsComplete: (complete: boolean) => void;
	setResults: (results: QuizResults) => void;
	nextQuestion: () => void;
	reset: () => void;
}

export const useQuizEngineStore = create<QuizEngineState>((set) => ({
	questions: [],
	currentIndex: 0,
	selectedAnswer: null,
	showFeedback: false,
	loading: true,
	isComplete: false,
	results: { correct: 0, incorrect: 0, skipped: 0 },

	setQuestions: (questions) => set({ questions }),
	setCurrentIndex: (currentIndex) => set({ currentIndex }),
	setSelectedAnswer: (selectedAnswer) => set({ selectedAnswer }),
	setShowFeedback: (showFeedback) => set({ showFeedback }),
	setLoading: (loading) => set({ loading }),
	setIsComplete: (isComplete) => set({ isComplete }),
	setResults: (results) => set({ results }),

	nextQuestion: () =>
		set((state) => {
			if (state.currentIndex >= state.questions.length - 1) {
				return { isComplete: true };
			}
			return {
				currentIndex: state.currentIndex + 1,
				selectedAnswer: null,
				showFeedback: false,
			};
		}),

	reset: () =>
		set({
			questions: [],
			currentIndex: 0,
			selectedAnswer: null,
			showFeedback: false,
			loading: true,
			isComplete: false,
			results: { correct: 0, incorrect: 0, skipped: 0 },
		}),
}));

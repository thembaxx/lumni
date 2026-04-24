import { create } from "zustand";

interface FlashcardsState {
	selectedSubject: string;
	isActive: boolean;
	currentIndex: number;
	isFlipped: boolean;
	knownCards: Set<string>;
	reviewCards: Set<string>;
	sessionComplete: boolean;

	setSelectedSubject: (subject: string) => void;
	setIsActive: (active: boolean) => void;
	setCurrentIndex: (index: number) => void;
	toggleFlip: () => void;
	markKnown: (cardId: string) => void;
	markReview: (cardId: string) => void;
	nextCard: () => void;
	resetSession: () => void;
}

export const useFlashcardsStore = create<FlashcardsState>((set) => ({
	selectedSubject: "",
	isActive: false,
	currentIndex: 0,
	isFlipped: false,
	knownCards: new Set<string>(),
	reviewCards: new Set<string>(),
	sessionComplete: false,

	setSelectedSubject: (selectedSubject) => set({ selectedSubject }),
	setIsActive: (isActive) => set({ isActive }),
	setCurrentIndex: (currentIndex) => set({ currentIndex }),
	toggleFlip: () => set((state) => ({ isFlipped: !state.isFlipped })),

	markKnown: (cardId: string) =>
		set((state) => {
			const newKnown = new Set(state.knownCards);
			newKnown.add(cardId);
			return { knownCards: newKnown };
		}),

	markReview: (cardId: string) =>
		set((state) => {
			const newReview = new Set(state.reviewCards);
			newReview.add(cardId);
			return { reviewCards: newReview };
		}),

	nextCard: () =>
		set((state) => ({
			currentIndex: state.currentIndex + 1,
			isFlipped: false,
		})),

	resetSession: () =>
		set({
			currentIndex: 0,
			isFlipped: false,
			knownCards: new Set(),
			reviewCards: new Set(),
			sessionComplete: false,
		}),
}));

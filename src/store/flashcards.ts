import { create } from "zustand";

interface StoredCardSet {
	values: string[];
}

function toStored(set: Set<string>): StoredCardSet {
	return { values: Array.from(set) };
}

function fromStored(stored: StoredCardSet | string[] | undefined): Set<string> {
	if (!stored) return new Set();
	if (Array.isArray(stored)) return new Set(stored);
	if (Array.isArray(stored.values)) return new Set(stored.values);
	return new Set();
}

interface FlashcardsState {
	selectedSubject: string;
	isActive: boolean;
	currentIndex: number;
	isFlipped: boolean;
	knownCards: StoredCardSet;
	reviewCards: StoredCardSet;
	sessionComplete: boolean;

	setSelectedSubject: (subject: string) => void;
	setIsActive: (active: boolean) => void;
	setCurrentIndex: (index: number) => void;
	toggleFlip: () => void;
	markKnown: (cardId: string) => void;
	markReview: (cardId: string) => void;
	nextCard: () => void;
	resetSession: () => void;

	getKnownSet: () => Set<string>;
	getReviewSet: () => Set<string>;
}

export const useFlashcardsStore = create<FlashcardsState>((set, get) => ({
	selectedSubject: "",
	isActive: false,
	currentIndex: 0,
	isFlipped: false,
	knownCards: { values: [] },
	reviewCards: { values: [] },
	sessionComplete: false,

	setSelectedSubject: (selectedSubject) => set({ selectedSubject }),
	setIsActive: (isActive) => set({ isActive }),
	setCurrentIndex: (currentIndex) => set({ currentIndex }),
	toggleFlip: () => set((state) => ({ isFlipped: !state.isFlipped })),

	markKnown: (cardId: string) =>
		set((state) => {
			const known = fromStored(state.knownCards);
			known.add(cardId);
			return { knownCards: toStored(known) };
		}),

	markReview: (cardId: string) =>
		set((state) => {
			const review = fromStored(state.reviewCards);
			review.add(cardId);
			return { reviewCards: toStored(review) };
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
			knownCards: { values: [] },
			reviewCards: { values: [] },
			sessionComplete: false,
		}),

	getKnownSet: () => fromStored(get().knownCards),
	getReviewSet: () => fromStored(get().reviewCards),
}));

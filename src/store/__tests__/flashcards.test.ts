import { beforeEach, describe, expect, test } from "bun:test";
import { useFlashcardsStore } from "../flashcards";

beforeEach(() => {
	const store = useFlashcardsStore;
	store.getState().resetSession();
});

describe("useFlashcardsStore", () => {
	test("initial state is empty", () => {
		const {
			selectedSubject,
			isActive,
			currentIndex,
			isFlipped,
		} = useFlashcardsStore.getState();
		expect(selectedSubject).toBe("");
		expect(isActive).toBe(false);
		expect(currentIndex).toBe(0);
		expect(isFlipped).toBe(false);
	});

	test("setSelectedSubject updates subject", () => {
		useFlashcardsStore.getState().setSelectedSubject("mathematics");
		expect(useFlashcardsStore.getState().selectedSubject).toBe("mathematics");
	});

	test("setIsActive sets active", () => {
		useFlashcardsStore.getState().setIsActive(true);
		expect(useFlashcardsStore.getState().isActive).toBe(true);
	});

	test("toggleFlip flips isFlipped", () => {
		useFlashcardsStore.getState().toggleFlip();
		expect(useFlashcardsStore.getState().isFlipped).toBe(true);
		useFlashcardsStore.getState().toggleFlip();
		expect(useFlashcardsStore.getState().isFlipped).toBe(false);
	});

	test("markKnown adds card to known set", () => {
		useFlashcardsStore.getState().markKnown("card1");
		const known = useFlashcardsStore.getState().getKnownSet();
		expect(known.has("card1")).toBe(true);
		expect(known.size).toBe(1);
	});

	test("markKnown is idempotent", () => {
		useFlashcardsStore.getState().markKnown("card1");
		useFlashcardsStore.getState().markKnown("card1");
		const known = useFlashcardsStore.getState().getKnownSet();
		expect(known.size).toBe(1);
	});

	test("markReview adds card to review set", () => {
		useFlashcardsStore.getState().markReview("card1");
		const review = useFlashcardsStore.getState().getReviewSet();
		expect(review.has("card1")).toBe(true);
		expect(review.size).toBe(1);
	});

	test("nextCard increments index and flips back", () => {
		useFlashcardsStore.getState().toggleFlip();
		useFlashcardsStore.getState().nextCard();
		expect(useFlashcardsStore.getState().currentIndex).toBe(1);
		expect(useFlashcardsStore.getState().isFlipped).toBe(false);
	});

	test("resetSession clears all session state", () => {
		useFlashcardsStore.getState().markKnown("card1");
		useFlashcardsStore.getState().markReview("card2");
		useFlashcardsStore.getState().toggleFlip();
		useFlashcardsStore.getState().setCurrentIndex(5);
		useFlashcardsStore.getState().resetSession();
		expect(useFlashcardsStore.getState().currentIndex).toBe(0);
		expect(useFlashcardsStore.getState().isFlipped).toBe(false);
		expect(useFlashcardsStore.getState().getKnownSet().size).toBe(0);
		expect(useFlashcardsStore.getState().getReviewSet().size).toBe(0);
	});

	test("getKnownSet and getReviewSet return empty sets initially", () => {
		expect(useFlashcardsStore.getState().getKnownSet().size).toBe(0);
		expect(useFlashcardsStore.getState().getReviewSet().size).toBe(0);
	});

	test("knownCards and reviewCards are stored as serializable objects", () => {
		useFlashcardsStore.getState().markKnown("card1");
		useFlashcardsStore.getState().markKnown("card2");
		useFlashcardsStore.getState().markReview("card3");

		const { knownCards, reviewCards } = useFlashcardsStore.getState();
		expect(knownCards.values).toContain("card1");
		expect(knownCards.values).toContain("card2");
		expect(reviewCards.values).toContain("card3");
	});
});

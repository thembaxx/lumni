"use client";

import { useCallback, useRef, useState } from "react";

type SwipeDirection = "left" | "right";

interface SwipeEntry {
	cardId: string;
	direction: SwipeDirection;
	quality: number;
}

interface SwipeDeckOptions {
	totalCards: number;
	mode: "simple" | "sm2";
	onReview: (cardId: string, quality: number) => void;
}

interface SwipeDeckState {
	currentIndex: number;
	swipeDirection: SwipeDirection | null;
	selectedQuality: number | null;
	showQualityPicker: boolean;
	canUndo: boolean;
	pending: boolean;
}

export function useSwipeDeck({ totalCards, mode, onReview }: SwipeDeckOptions) {
	const [state, setState] = useState<SwipeDeckState>({
		currentIndex: 0,
		swipeDirection: null,
		selectedQuality: null,
		showQualityPicker: false,
		canUndo: false,
		pending: false,
	});

	const undoStack = useRef<SwipeEntry[]>([]);
	const pendingRef = useRef(false);

	const defaultQuality = useCallback(
		(direction: SwipeDirection) =>
			direction === "right" ? (mode === "sm2" ? 4 : 4) : mode === "sm2" ? 1 : 1,
		[mode],
	);

	const advance = useCallback(
		(cardId: string, direction: SwipeDirection, quality?: number) => {
			if (pendingRef.current) return;

			const q = quality ?? defaultQuality(direction);
			pendingRef.current = true;

			undoStack.current.push({ cardId, direction, quality: q });

			onReview(cardId, q);

			setState((prev) => ({
				...prev,
				currentIndex: prev.currentIndex + 1,
				swipeDirection: direction,
				selectedQuality: q,
				showQualityPicker: false,
				canUndo: true,
				pending: true,
			}));
		},
		[onReview, defaultQuality],
	);

	const onSwipeEnd = useCallback(
		(cardId: string, direction: SwipeDirection) => {
			advance(cardId, direction);
		},
		[advance],
	);

	const onQualitySelect = useCallback(
		(cardId: string, direction: SwipeDirection, quality: number) => {
			advance(cardId, direction, quality);
		},
		[advance],
	);

	const undo = useCallback(() => {
		const entry = undoStack.current.pop();
		if (!entry) return;

		pendingRef.current = false;
		setState((prev) => ({
			...prev,
			currentIndex: Math.max(0, prev.currentIndex - 1),
			swipeDirection: null,
			selectedQuality: null,
			showQualityPicker: false,
			canUndo: undoStack.current.length > 0,
			pending: false,
		}));
	}, []);

	const resetPending = useCallback(() => {
		pendingRef.current = false;
		setState((prev) => ({ ...prev, pending: false }));
	}, []);

	const isComplete = state.currentIndex >= totalCards && totalCards > 0;

	return {
		...state,
		isComplete,
		onSwipeEnd,
		onQualitySelect,
		undo,
		resetPending,
	};
}

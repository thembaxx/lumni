import type { Metadata } from "next";
import { FlashcardsClient } from "./flashcards-client";

export const metadata: Metadata = {
	title: "Flashcards - Lumni",
	description: "Study with spaced repetition flashcards",
};

export default function FlashcardsPage() {
	return <FlashcardsClient />;
}

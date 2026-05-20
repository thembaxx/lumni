import type { Metadata } from "next";
import { FlashcardCreator } from "@/components/tools/flashcards/flashcard-creator";

export const metadata: Metadata = {
	title: "New Flashcard",
};

export default function NewFlashcardPage() {
	return (
		<div className="flex min-h-[100dvh] items-center justify-center px-4 py-8">
			<FlashcardCreator />
		</div>
	);
}

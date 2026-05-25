import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { FlashcardCreator } from "@/components/tools/flashcards/flashcard-creator";

export const metadata: Metadata = {
	title: "New Flashcard",
};

export default function NewFlashcardPage() {
	return (
		<PageContainer className="flex min-h-[100dvh] items-center justify-center py-8">
			<FlashcardCreator />
		</PageContainer>
	);
}

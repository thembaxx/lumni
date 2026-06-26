import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { FlashcardCreator } from "@/components/tools/flashcards/flashcard-creator";

export const metadata: Metadata = {
  title: "New Flashcard",
};

export const instant = false;

export default function NewFlashcardPage() {
  return (
    <PageContainer className="flex min-h-dvh items-center justify-center py-8">
      <FlashcardCreator />
    </PageContainer>
  );
}

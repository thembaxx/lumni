import type { Metadata } from "next";
import { FlashcardBrowseClient } from "./flashcard-browse-client";

export const metadata: Metadata = {
  title: "Browse Flashcards - Lumni",
  description: "Browse, search, and manage your flashcard collection",
};

export default function FlashcardBrowsePage() {
  return <FlashcardBrowseClient />;
}

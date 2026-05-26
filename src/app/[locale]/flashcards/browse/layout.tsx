import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Browse Flashcards - Lumni",
	description: "Browse and manage your flashcards",
};

export default function FlashcardsBrowseLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}

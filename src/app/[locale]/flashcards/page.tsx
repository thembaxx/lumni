import type { Metadata } from "next";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { FlashcardsClient } from "./flashcards-client";

export const metadata: Metadata = {
	title: "Flashcards - Lumni",
	description: "Study with spaced repetition flashcards",
};

export default function FlashcardsPage() {
	return (
		<AppErrorBoundary>
			<FlashcardsClient />
		</AppErrorBoundary>
	);
}

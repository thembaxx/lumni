import type { Metadata } from "next";
import { SharedQuestionClient } from "./shared-question-client";

export const metadata: Metadata = {
	title: "Shared Question | Lumni",
	description: "View and rate a shared question from Lumni",
};

export default function SharedQuestionPage() {
	return <SharedQuestionClient />;
}

import type { Metadata } from "next";
import { SearchClient } from "./search-client";

export const metadata: Metadata = {
	title: "Search - Lumni",
	description: "Search across your study materials and flashcards",
};

export default function SearchPage() {
	return <SearchClient />;
}

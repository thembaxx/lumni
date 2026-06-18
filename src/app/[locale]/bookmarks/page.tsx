import type { Metadata } from "next";
import { BookmarksClient } from "./bookmarks-client";

export const metadata: Metadata = {
	title: "Bookmarks - Lumni",
	description: "View your bookmarked questions saved during quizzes",
};

export default function BookmarksPage() {
	return <BookmarksClient />;
}

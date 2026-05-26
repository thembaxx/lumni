import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Bookmarks - Lumni",
	description: "View your bookmarked questions and resources",
};

export default function BookmarksLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}

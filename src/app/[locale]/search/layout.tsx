import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Search - Lumni",
	description: "Search across your study content",
};

export default function SearchLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}

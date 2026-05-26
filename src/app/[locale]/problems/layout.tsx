import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Problems - Lumni",
	description: "Practice problems and exercises",
};

export default function ProblemsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Visual Dev - Lumni",
	description: "Visual engine developer tools",
};

export default function VisualDevLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}

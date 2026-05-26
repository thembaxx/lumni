import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Engine Dev - Lumni",
	description: "Question engine developer tools",
};

export default function EngineDevLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}

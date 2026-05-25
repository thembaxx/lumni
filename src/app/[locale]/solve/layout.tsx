import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "AI Solver - Lumni",
	description: "Solve math problems with AI-powered step-by-step help",
};

export default function SolveLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Parent Dashboard - Lumni",
	description: "Monitor your child's learning progress",
};

export default function ParentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}

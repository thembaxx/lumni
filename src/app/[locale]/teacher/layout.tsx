import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Teacher Dashboard - Lumni",
	description: "Manage your class and student progress",
};

export default function TeacherLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}

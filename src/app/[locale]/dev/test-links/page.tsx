"use client";

import { PageShell } from "@/components/layout/page-shell";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

const PAGES = [
	{ name: "Home", path: "/" },
	{ name: "Dashboard", path: "/dashboard" },
	{ name: "Exams", path: "/dashboard/exams" },
	{ name: "Quiz", path: "/quiz" },
	{ name: "Settings", path: "/settings" },
	{ name: "Study Plan", path: "/study-plan" },
	{ name: "Solve", path: "/solve" },
	{ name: "Dev Visual", path: "/dev/visual" },
	{ name: "Dev Engine", path: "/dev/engine" },
	{ name: "Admin Budget", path: "/admin/budget" },
	{ name: "Admin Questions", path: "/admin/questions" },
	{ name: "Admin Quality", path: "/admin/quality" },
	{ name: "Admin Home", path: "/admin" },
	{ name: "New Flashcard", path: "/tools/flashcards/new" },
	{ name: "Past Papers", path: "/past-papers" },
	{ name: "Sign Up", path: "/auth/sign-up" },
	{ name: "Sign In", path: "/auth/sign-in" },
	{ name: "Bookmarks", path: "/bookmarks" },
	{ name: "Problems", path: "/problems" },
	{ name: "Upload", path: "/upload" },
	{ name: "Test Exam", path: "/exam/test-id" },
	{ name: "Flashcards", path: "/flashcards" },
	{ name: "Review", path: "/review" },
	{ name: "Premium", path: "/premium" },
];

export default function TestLinksPage() {
	return (
		<PageShell title="Test Links" subtitle="Navigate to all app pages">
			<div className="grid grid-cols-1 gap-3 p-4">
				{PAGES.map((page) => (
					<Link
						key={page.path}
						href={page.path}
						className="block transition-transform active:scale-95"
					>
						<Card size="sm">
							<CardHeader>
								<CardTitle>{page.name}</CardTitle>
								<CardDescription className="font-mono">
									{page.path}
								</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</PageShell>
	);
}

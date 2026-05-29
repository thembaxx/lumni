"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function AnalyticsEmptyState() {
	return (
		<div className="p-8 text-center">
			<div className="mb-6">
				<svg
					className="size-4 text-[--system-accent]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>No data</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 12h6m-6 4h6m2 5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
			<h3 className="mb-2 font-semibold text-lg">No Analytics Yet</h3>
			<p className="mb-4 text-muted-foreground">
				Complete some quizzes to see your performance analytics.
			</p>
			<Button
				render={<Link href="/quiz">Start Quiz</Link>}
				nativeButton={false}
			>
				Start Quiz
			</Button>
		</div>
	);
}
